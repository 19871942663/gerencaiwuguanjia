// db.js — IndexedDB 数据库操作（通过 Dexie.js）
const db = new Dexie("FinanceDB");

db.version(1).stores({
  entries: "++id, type, category, date, amount, isDeleted, syncStatus",
  idMap: "localId, supabaseId",
  syncQueue: "++localId, tableName, recordId, operation, createdAt",
  user: "id",
});

const DB = {
  // 添加记录
  async addEntry(entry) {
    const now = new Date().toISOString();
    const record = {
      type: entry.type,
      category: entry.category,
      date: entry.date,
      amount: Math.round(entry.amount * 100) / 100,
      note: entry.note || "",
      isDeleted: false,
      syncStatus: "pending",
      createdAt: now,
      updatedAt: now,
    };
    const id = await db.entries.add(record);
    await db.syncQueue.add({
      tableName: "entries",
      recordId: id,
      operation: "insert",
      payload: JSON.stringify({ ...record, id }),
      createdAt: now,
    });
    return id;
  },

  // 更新记录
  async updateEntry(id, updates) {
    const now = new Date().toISOString();
    const record = {
      ...updates,
      amount: updates.amount != null ? Math.round(updates.amount * 100) / 100 : undefined,
      updatedAt: now,
      syncStatus: "pending",
    };
    await db.entries.update(id, record);
    await db.syncQueue.add({
      tableName: "entries",
      recordId: id,
      operation: "update",
      payload: JSON.stringify({ id, ...record }),
      createdAt: now,
    });
  },

  // 软删除
  async deleteEntry(id) {
    const now = new Date().toISOString();
    await db.entries.update(id, {
      isDeleted: true,
      updatedAt: now,
      syncStatus: "pending",
    });
    await db.syncQueue.add({
      tableName: "entries",
      recordId: id,
      operation: "delete",
      payload: JSON.stringify({ id }),
      createdAt: now,
    });
  },

  // 按类型获取记录
  async getEntriesByTypes(types) {
    return db.entries
      .where("type")
      .anyOf(types)
      .and(function (entry) { return !entry.isDeleted; })
      .reverse()
      .sortBy("date");
  },

  // 按类型和日期范围获取
  async getEntriesByTypesAndDateRange(types, startDate, endDate) {
    const all = await db.entries
      .where("type")
      .anyOf(types)
      .and(function (entry) {
        return !entry.isDeleted && entry.date >= startDate && entry.date <= endDate;
      })
      .sortBy("date");
    return all;
  },

  // 获取所有未删除记录
  async getAllEntries() {
    return db.entries
      .filter(function (entry) { return !entry.isDeleted; })
      .reverse()
      .sortBy("date");
  },

  // 按 ID 获取单条
  async getEntry(id) {
    return db.entries.get(id);
  },

  // 获取同步队列数量
  async getPendingSyncCount() {
    return db.syncQueue.count();
  },

  // 获取用户信息
  async getUser() {
    const users = await db.user.toArray();
    return users[0] || null;
  },

  // 保存用户信息
  async saveUser(info) {
    await db.user.clear();
    await db.user.add(info);
  },

  // 获取 ID 映射
  async getIdMap(localId) {
    return db.idMap.where("localId").equals(localId).first();
  },

  // 保存 ID 映射
  async saveIdMap(localId, supabaseId) {
    await db.idMap.put({ localId, supabaseId });
  },

  // 根据 supabaseId 查找映射
  async getIdMapBySupabase(supabaseId) {
    return db.idMap.where("supabaseId").equals(supabaseId).first();
  },
};
