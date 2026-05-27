// forms.js — 数据录入表单、编辑、删除
const Forms = {
  editingId: null,

  // 预设分类
  categoryPresets: {
    asset:          ["银行存款", "现金", "股票", "基金", "房产", "车辆", "其他资产"],
    liability:      ["房贷", "车贷", "信用卡欠款", "其他负债"],
    income:         ["工资", "奖金", "投资收益", "兼职", "其他收入"],
    expense:        ["餐饮", "交通", "房租", "购物", "娱乐", "医疗", "教育", "其他支出"],
    cash_inflow:    ["工资到账", "投资收益到账", "借款", "其他流入"],
    cash_outflow:   ["还贷款", "消费支出", "转账支出", "其他流出"],
  },

  // 类型中文名
  typeLabels: {
    asset: "资产", liability: "负债",
    income: "收入", expense: "支出",
    cash_inflow: "现金流入", cash_outflow: "现金流出",
  },

  // 渲染表单
  showForm(entry) {
    this.editingId = entry ? entry.id : null;
    const container = document.getElementById("entry-form-container");
    const entryType = entry ? entry.type : "";

    let categoryOptions = "";
    if (entryType && this.categoryPresets[entryType]) {
      categoryOptions = this.categoryPresets[entryType]
        .map(function (c) { return '<option value="' + c + '">' + c + '</option>'; })
        .join("");
    }

    container.innerHTML = '\
      <div class="form-panel">\
        <h3>' + (entry ? "编辑记录" : "添加记录") + '</h3>\
        <div class="form-group">\
          <label>类型</label>\
          <select id="form-type" required>\
            <option value="">请选择类型</option>\
            <option value="asset"' + (entryType === "asset" ? " selected" : "") + '>资产</option>\
            <option value="liability"' + (entryType === "liability" ? " selected" : "") + '>负债</option>\
            <option value="income"' + (entryType === "income" ? " selected" : "") + '>收入</option>\
            <option value="expense"' + (entryType === "expense" ? " selected" : "") + '>支出</option>\
            <option value="cash_inflow"' + (entryType === "cash_inflow" ? " selected" : "") + '>现金流入</option>\
            <option value="cash_outflow"' + (entryType === "cash_outflow" ? " selected" : "") + '>现金流出</option>\
          </select>\
        </div>\
        <div class="form-group">\
          <label>分类</label>\
          <select id="form-category" required>\
            ' + (categoryOptions || '<option value="">请先选择类型</option>') + '\
          </select>\
        </div>\
        <div class="form-group">\
          <label>日期</label>\
          <input type="date" id="form-date" required value="' + (entry ? entry.date : new Date().toISOString().slice(0, 10)) + '">\
        </div>\
        <div class="form-group">\
          <label>金额 (元)</label>\
          <input type="number" id="form-amount" step="0.01" min="0.01" placeholder="请输入金额" required value="' + (entry ? entry.amount : "") + '">\
        </div>\
        <div class="form-group">\
          <label>备注</label>\
          <input type="text" id="form-note" placeholder="选填" value="' + (entry ? (entry.note || "") : "") + '">\
        </div>\
        <div class="form-actions">\
          <button class="btn-cancel" id="btn-form-cancel">取消</button>\
          ' + (entry ? '<button class="btn-delete" id="btn-form-delete">删除</button>' : "") + '\
          <button class="btn-save" id="btn-form-save">保存</button>\
        </div>\
      </div>';

    container.style.display = "flex";

    // 类型切换时更新分类选项
    var typeSelect = document.getElementById("form-type");
    var catSelect = document.getElementById("form-category");
    var self = this;

    typeSelect.addEventListener("change", function () {
      var t = this.value;
      catSelect.innerHTML = "";
      if (t && self.categoryPresets[t]) {
        self.categoryPresets[t].forEach(function (c) {
          var opt = document.createElement("option");
          opt.value = c;
          opt.textContent = c;
          catSelect.appendChild(opt);
        });
      } else {
        var opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "请先选择类型";
        catSelect.appendChild(opt);
      }
    });

    // 如果是编辑，设置分类值
    if (entry && entry.category) {
      setTimeout(function () { catSelect.value = entry.category; }, 0);
    }

    // 事件绑定
    document.getElementById("btn-form-cancel").addEventListener("click", function () { self.hideForm(); });
    document.getElementById("btn-form-save").addEventListener("click", function () { self.handleSubmit(); });
    if (entry) {
      document.getElementById("btn-form-delete").addEventListener("click", function () { self.handleDelete(); });
    }

    // 点击遮罩关闭
    container.addEventListener("click", function (e) {
      if (e.target === container) self.hideForm();
    });

    setTimeout(function () { document.getElementById("form-type").focus(); }, 100);
  },

  // 隐藏表单
  hideForm() {
    document.getElementById("entry-form-container").style.display = "none";
    document.getElementById("entry-form-container").innerHTML = "";
    this.editingId = null;
  },

  // 提交表单
  async handleSubmit() {
    var type = document.getElementById("form-type").value;
    var category = document.getElementById("form-category").value;
    var date = document.getElementById("form-date").value;
    var amountStr = document.getElementById("form-amount").value;
    var note = document.getElementById("form-note").value;

    if (!type) { alert("请选择类型"); return; }
    if (!category) { alert("请选择分类"); return; }
    if (!date) { alert("请选择日期"); return; }
    var amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) { alert("请输入有效的金额"); return; }

    var entry = { type: type, category: category, date: date, amount: amount, note: note };

    try {
      if (this.editingId) {
        await DB.updateEntry(this.editingId, entry);
      } else {
        await DB.addEntry(entry);
      }
      this.hideForm();
      await App.refreshAll();
    } catch (err) {
      console.error("保存失败:", err);
      alert("保存失败: " + err.message);
    }
  },

  // 删除记录
  async handleDelete() {
    if (!confirm("确定删除这条记录吗？")) return;
    try {
      await DB.deleteEntry(this.editingId);
      this.hideForm();
      await App.refreshAll();
    } catch (err) {
      console.error("删除失败:", err);
      alert("删除失败: " + err.message);
    }
  },

  // 渲染记录列表
  async renderEntryList(filterType, filterMonth) {
    var container = document.getElementById("entry-list");
    var entries = await DB.getAllEntries();

    // 按类型筛选
    if (filterType && filterType !== "all") {
      entries = entries.filter(function (e) { return e.type === filterType; });
    }

    // 按月份筛选
    if (filterMonth && filterMonth !== "all") {
      entries = entries.filter(function (e) { return e.date.startsWith(filterMonth); });
    }

    if (entries.length === 0) {
      container.innerHTML = '<p class="empty-hint">暂无记录，点击上方按钮添加</p>';
      return;
    }

    // 按日期分组
    var grouped = {};
    entries.forEach(function (e) {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });

    var dates = Object.keys(grouped).sort().reverse();
    var self = this;
    var html = "";

    dates.forEach(function (date) {
      html += '<div class="date-group"><div class="date-header">' + date + '</div>';
      grouped[date].forEach(function (e) {
        var badgeClass = "badge-" + e.type;
        var typeLabel = self.typeLabels[e.type] || e.type;
        var amountClass = "";
        if (e.type === "asset" || e.type === "income" || e.type === "cash_inflow") {
          amountClass = "amount-positive";
        } else {
          amountClass = "amount-negative";
        }

        html += '\
          <div class="entry-card" data-id="' + e.id + '">\
            <span class="type-badge ' + badgeClass + '">' + typeLabel + '</span>\
            <div class="entry-info">\
              <div class="entry-category">' + e.category + '</div>\
              ' + (e.note ? '<div class="entry-note">' + e.note + '</div>' : "") + '\
            </div>\
            <div class="entry-amount ' + amountClass + '">' + (e.type === "asset" || e.type === "income" || e.type === "cash_inflow" ? "+" : "-") + "¥" + e.amount.toFixed(2) + '</div>\
          </div>';
      });
      html += '</div>';
    });

    container.innerHTML = html;

    // 点击编辑
    container.querySelectorAll(".entry-card").forEach(function (card) {
      card.addEventListener("click", async function () {
        var id = parseInt(this.dataset.id);
        var entry = await DB.getEntry(id);
        if (entry) self.showForm(entry);
      });
    });
  },

  // 更新月份筛选下拉框
  async updateMonthFilter() {
    var select = document.getElementById("filter-month");
    if (!select) return;
    var entries = await DB.getAllEntries();
    var months = new Set();
    entries.forEach(function (e) {
      months.add(e.date.substring(0, 7));
    });
    var sorted = Array.from(months).sort().reverse();
    select.innerHTML = '<option value="all">全部月份</option>';
    sorted.forEach(function (m) {
      select.innerHTML += '<option value="' + m + '">' + m + '</option>';
    });
  },
};
