// sync.js — 云同步逻辑（REST API 直连，无需登录）
var Sync = {
  enabled: true,
  deviceId: null,

  _baseURL: "https://cifnfqhagdmxvhruybmy.supabase.co/rest/v1",
  _apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpZm5mcWhhZ2RteHZocnV5Ym15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NDc5NTEsImV4cCI6MjA5NTQyMzk1MX0.nIGkv0mxkl0MKNNJd62577a0ANOaW6pMWij7Haqmi44",

  // 初始化
  async init() {
    try {
      var userInfo = await DB.getUser();
      if (!userInfo || !userInfo.deviceId) {
        this.deviceId = this._generateUUID();
        await DB.saveUser({ id: 1, deviceId: this.deviceId, lastSyncAt: "1970-01-01T00:00:00Z" });
      } else {
        this.deviceId = userInfo.deviceId;
        if (!userInfo.lastSyncAt) {
          await DB.saveUser({ id: 1, deviceId: this.deviceId, lastSyncAt: "1970-01-01T00:00:00Z" });
        }
      }
      // 测试连接
      var testResult = await this._fetch("GET", "/entries?limit=1");
      if (testResult.ok) {
        this.enabled = true;
        console.log("Sync enabled, device:", this.deviceId);
      } else {
        console.warn("Sync connection test failed:", testResult.status, testResult.error || "unknown");
        this.enabled = false;
      }
    } catch (err) {
      console.warn("Sync init failed:", err.message);
      this.enabled = false;
    }
  },

  // 封装的 fetch 请求
  async _fetch(method, path, body) {
    var headers = {
      "apikey": this._apiKey,
      "Authorization": "Bearer " + this._apiKey,
    };
    if (body) {
      headers["Content-Type"] = "application/json";
      headers["Prefer"] = "return=representation";
    }
    var options = { method: method, headers: headers };
    if (body) options.body = JSON.stringify(body);

    try {
      var response = await fetch(this._baseURL + path, options);
      var result = { ok: response.ok, status: response.status, data: null };
      if (response.ok && method !== "DELETE") {
        var text = await response.text();
        result.data = text ? JSON.parse(text) : [];
      }
      return result;
    } catch (err) {
      return { ok: false, status: 0, error: err.message };
    }
  },

  // 推送本地修改到 Supabase
  async pushChanges() {
    if (!this.enabled || !navigator.onLine) return { pushed: 0 };

    var queue = await db.syncQueue.orderBy("createdAt").toArray();
    var pushed = 0;

    for (var i = 0; i < queue.length; i++) {
      var item = queue[i];
      try {
        var payload = JSON.parse(item.payload);
        if (item.operation === "insert") {
          var insertData = {
            user_id: this.deviceId,
            local_id: item.recordId,
            type: payload.type,
            category: payload.category,
            date: payload.date,
            amount: payload.amount,
            note: payload.note || "",
          };
          var result = await this._fetch("POST", "/entries", insertData);
          if (!result.ok) throw new Error("Insert failed: " + result.status);
          if (result.data && result.data.length > 0) {
            await DB.saveIdMap(item.recordId, result.data[0].id);
          }
          await db.entries.update(item.recordId, { syncStatus: "synced" });
        } else if (item.operation === "update") {
          var mapping = await DB.getIdMap(item.recordId);
          if (mapping) {
            var updateData = {
              type: payload.type,
              category: payload.category,
              date: payload.date,
              amount: payload.amount,
              note: payload.note || "",
              updated_at: new Date().toISOString(),
            };
            await this._fetch("PATCH", "/entries?id=eq." + encodeURIComponent(mapping.supabaseId), updateData);
          }
          await db.entries.update(item.recordId, { syncStatus: "synced" });
        } else if (item.operation === "delete") {
          var mapping2 = await DB.getIdMap(item.recordId);
          if (mapping2) {
            await this._fetch("PATCH", "/entries?id=eq." + encodeURIComponent(mapping2.supabaseId), {
              is_deleted: true,
              updated_at: new Date().toISOString(),
            });
          }
        }
        await db.syncQueue.delete(item.localId);
        pushed++;
      } catch (err) {
        console.warn("Push failed for item " + item.localId + ":", err.message);
      }
    }
    return { pushed: pushed };
  },

  // 从 Supabase 拉取远程修改（拉取其他设备的记录）
  async pullChanges() {
    if (!this.enabled || !navigator.onLine) return { pulled: 0 };

    var userInfo = await DB.getUser();
    if (!userInfo) return { pulled: 0 };
    var lastSync = userInfo.lastSyncAt || "1970-01-01T00:00:00Z";

    // 拉取其他设备的记录
    var path = "/entries?user_id=neq." + encodeURIComponent(this.deviceId)
      + "&updated_at=gt." + encodeURIComponent(lastSync)
      + "&order=updated_at.asc&limit=100";

    var result = await this._fetch("GET", path);
    if (!result.ok) return { pulled: 0 };

    var remoteEntries = result.data || [];
    var pulled = 0;

    for (var i = 0; i < remoteEntries.length; i++) {
      var remote = remoteEntries[i];
      var mapping = await DB.getIdMapBySupabase(remote.id);

      if (mapping) {
        await db.entries.update(mapping.localId, {
          type: remote.type,
          category: remote.category,
          date: remote.date,
          amount: parseFloat(remote.amount),
          note: remote.note || "",
          isDeleted: remote.is_deleted,
          syncStatus: "synced",
          updatedAt: remote.updated_at,
        });
      } else {
        var localId = await db.entries.add({
          type: remote.type,
          category: remote.category,
          date: remote.date,
          amount: parseFloat(remote.amount),
          note: remote.note || "",
          isDeleted: remote.is_deleted || false,
          syncStatus: "synced",
          createdAt: remote.created_at,
          updatedAt: remote.updated_at,
        });
        await DB.saveIdMap(localId, remote.id);
      }
      pulled++;
    }

    if (pulled > 0) {
      await DB.saveUser({
        id: 1,
        deviceId: this.deviceId,
        lastSyncAt: new Date().toISOString(),
      });
    }
    return { pulled: pulled };
  },

  // 完整同步：先拉后推
  async fullSync() {
    if (!this.enabled) return;
    await this.pullChanges();
    await this.pushChanges();
    await UI.updateSyncBar();
  },

  // 生成 UUID
  _generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      var v = c === "x" ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
};
