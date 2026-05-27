// ui.js — DOM 渲染：表格、状态栏
const UI = {
  // 格式化金额
  formatAmount(amount) {
    return "¥" + amount.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },

  // 判断是否为正向类型
  _isPositive(type) {
    return type === "asset" || type === "income" || type === "cash_inflow";
  },

  // 渲染资产负债表表格
  renderBalanceTable(data) {
    var tbody = document.querySelector("#balance-table tbody");
    var emptyEl = document.getElementById("balance-empty");
    var tableContainer = document.querySelector("#tab-balance .table-container");

    if (data.totalAssets === 0 && data.totalLiabilities === 0) {
      tableContainer.style.display = "none";
      emptyEl.classList.add("show");
    } else {
      tableContainer.style.display = "block";
      emptyEl.classList.remove("show");
    }

    var rows = "";

    // 资产明细
    if (data.assetItems.length > 0) {
      rows += '<tr><td colspan="2" style="color:var(--income);font-weight:600;font-size:13px;">资产</td></tr>';
      var assetGroups = Statements.groupByCategory(data.assetItems);
      Object.keys(assetGroups).sort().forEach(function (cat) {
        rows += "<tr><td>" + cat + "</td><td class='amount-positive'>" + UI.formatAmount(assetGroups[cat]) + "</td></tr>";
      });
    }

    // 负债明细
    if (data.liabilityItems.length > 0) {
      rows += '<tr><td colspan="2" style="color:var(--expense);font-weight:600;font-size:13px;">负债</td></tr>';
      var liabilityGroups = Statements.groupByCategory(data.liabilityItems);
      Object.keys(liabilityGroups).sort().forEach(function (cat) {
        rows += "<tr><td>" + cat + "</td><td class='amount-negative'>" + UI.formatAmount(liabilityGroups[cat]) + "</td></tr>";
      });
    }

    // 合计
    rows += '<tr class="total-row"><td>总资产</td><td class="amount-positive">' + UI.formatAmount(data.totalAssets) + "</td></tr>";
    rows += '<tr class="total-row"><td>总负债</td><td class="amount-negative">' + UI.formatAmount(data.totalLiabilities) + "</td></tr>";
    var netClass = data.netWorth >= 0 ? "amount-net" : "amount-negative";
    rows += '<tr class="total-row"><td>净资产</td><td class="' + netClass + '">' + UI.formatAmount(data.netWorth) + "</td></tr>";

    tbody.innerHTML = rows;
  },

  // 渲染收入支出表
  renderIncomeTable(data) {
    var tbody = document.querySelector("#income-table tbody");
    var emptyEl = document.getElementById("income-empty");
    var tableContainer = document.querySelector("#tab-income .table-container");

    if (data.totalIncome === 0 && data.totalExpenses === 0) {
      tableContainer.style.display = "none";
      emptyEl.classList.add("show");
    } else {
      tableContainer.style.display = "block";
      emptyEl.classList.remove("show");
    }

    var rows = "";

    // 收入明细
    if (data.incomeItems.length > 0) {
      rows += '<tr><td colspan="2" style="color:var(--income);font-weight:600;font-size:13px;">收入</td></tr>';
      var incomeGroups = Statements.groupByCategory(data.incomeItems);
      Object.keys(incomeGroups).sort().forEach(function (cat) {
        rows += "<tr><td>" + cat + "</td><td class='amount-positive'>" + UI.formatAmount(incomeGroups[cat]) + "</td></tr>";
      });
    }

    // 支出明细
    if (data.expenseItems.length > 0) {
      rows += '<tr><td colspan="2" style="color:var(--expense);font-weight:600;font-size:13px;">支出</td></tr>';
      var expenseGroups = Statements.groupByCategory(data.expenseItems);
      Object.keys(expenseGroups).sort().forEach(function (cat) {
        rows += "<tr><td>" + cat + "</td><td class='amount-negative'>" + UI.formatAmount(expenseGroups[cat]) + "</td></tr>";
      });
    }

    // 合计
    rows += '<tr class="total-row"><td>总收入</td><td class="amount-positive">' + UI.formatAmount(data.totalIncome) + "</td></tr>";
    rows += '<tr class="total-row"><td>总支出</td><td class="amount-negative">' + UI.formatAmount(data.totalExpenses) + "</td></tr>";
    var netClass = data.netIncome >= 0 ? "amount-net" : "amount-negative";
    rows += '<tr class="total-row"><td>净收入</td><td class="' + netClass + '">' + UI.formatAmount(data.netIncome) + "</td></tr>";

    tbody.innerHTML = rows;
  },

  // 渲染现金流表
  renderCashflowTable(data) {
    var tbody = document.querySelector("#cashflow-table tbody");
    var emptyEl = document.getElementById("cashflow-empty");
    var tableContainer = document.querySelector("#tab-cashflow .table-container");

    if (data.totalInflow === 0 && data.totalOutflow === 0) {
      tableContainer.style.display = "none";
      emptyEl.classList.add("show");
    } else {
      tableContainer.style.display = "block";
      emptyEl.classList.remove("show");
    }

    var rows = "";

    // 流入明细
    if (data.inflowItems.length > 0) {
      rows += '<tr><td colspan="2" style="color:var(--income);font-weight:600;font-size:13px;">流入</td></tr>';
      var inflowGroups = Statements.groupByCategory(data.inflowItems);
      Object.keys(inflowGroups).sort().forEach(function (cat) {
        rows += "<tr><td>" + cat + "</td><td class='amount-positive'>" + UI.formatAmount(inflowGroups[cat]) + "</td></tr>";
      });
    }

    // 流出明细
    if (data.outflowItems.length > 0) {
      rows += '<tr><td colspan="2" style="color:var(--expense);font-weight:600;font-size:13px;">流出</td></tr>';
      var outflowGroups = Statements.groupByCategory(data.outflowItems);
      Object.keys(outflowGroups).sort().forEach(function (cat) {
        rows += "<tr><td>" + cat + "</td><td class='amount-negative'>" + UI.formatAmount(outflowGroups[cat]) + "</td></tr>";
      });
    }

    // 合计
    rows += '<tr class="total-row"><td>总流入</td><td class="amount-positive">' + UI.formatAmount(data.totalInflow) + "</td></tr>";
    rows += '<tr class="total-row"><td>总流出</td><td class="amount-negative">' + UI.formatAmount(data.totalOutflow) + "</td></tr>";
    var netClass = data.netCashFlow >= 0 ? "amount-net" : "amount-negative";
    rows += '<tr class="total-row"><td>净现金流</td><td class="' + netClass + '">' + UI.formatAmount(data.netCashFlow) + "</td></tr>";

    tbody.innerHTML = rows;
  },

  // 渲染对比信息
  renderComparison(elementId, currentTotal, previousTotal, label) {
    var el = document.getElementById(elementId);
    if (!previousTotal || previousTotal === 0) {
      el.innerHTML = "";
      return;
    }
    var diff = currentTotal - previousTotal;
    var pct = previousTotal !== 0 ? Math.round((diff / previousTotal) * 100) : 0;
    if (pct === 0) {
      el.innerHTML = "与" + label + "持平";
      return;
    }
    var dir = pct > 0 ? "up" : "down";
    var arrow = pct > 0 ? "↑" : "↓";
    el.innerHTML = '较' + label + ' <span class="' + dir + '">' + arrow + " " + Math.abs(pct) + "%</span>";
  },

  // 更新同步状态栏
  async updateSyncBar() {
    var dot = document.getElementById("sync-status-dot");
    var text = document.getElementById("sync-status-text");
    var pendingText = document.getElementById("sync-pending-text");

    var isOnline = navigator.onLine;
    dot.className = "dot " + (isOnline ? "online" : "offline");
    text.textContent = isOnline ? "在线" : "离线";

    var pendingCount = await DB.getPendingSyncCount();
    pendingText.textContent = "等待同步: " + pendingCount + "条";
  },

  // 切换 Tab
  switchTab(tabId) {
    document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
    document.querySelectorAll(".tab-btn").forEach(function (b) { b.classList.remove("active"); });

    var panel = document.getElementById("tab-" + tabId);
    if (panel) panel.classList.add("active");

    var btn = document.querySelector('[data-tab="' + tabId + '"]');
    if (btn) btn.classList.add("active");
  },

  // 设置时间筛选按钮状态
  setActivePeriod(period) {
    document.querySelectorAll(".period-btn").forEach(function (btn) {
      btn.classList.remove("active");
      if (btn.dataset.period === period) btn.classList.add("active");
    });
  },
};
