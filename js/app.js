// app.js — 应用入口：初始化、Tab 切换、全局状态
var App = {
  currentTab: "balance",
  currentPeriod: "month",

  async init() {
    var self = this;

    // 1. 初始化本地数据库
    var user = await DB.getUser();
    if (!user) {
      await DB.saveUser({ id: 1, lastSyncAt: "1970-01-01T00:00:00Z" });
    }

    // 2. 初始化同步（可选）
    await Sync.init();

    // 3. 注册 Service Worker
    if ("serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("sw.js");
      } catch (e) {
        console.warn("SW registration failed:", e);
      }
    }

    // 4. 设置 Tab 导航
    document.querySelectorAll("#tab-bar .tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tabId = this.dataset.tab;
        self.currentTab = tabId;
        UI.switchTab(tabId);
        self.refreshAll();
      });
    });

    // 5. 设置时间筛选按钮
    document.querySelectorAll(".period-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var period = this.dataset.period;
        self.currentPeriod = period;
        // 更新当前 Tab 下的时间按钮状态
        var activePanel = document.querySelector(".tab-panel.active");
        if (activePanel) {
          activePanel.querySelectorAll(".period-btn").forEach(function (b) {
            b.classList.toggle("active", b.dataset.period === period);
          });
        }
        self.refreshStatements();
      });
    });

    // 6. 录入页面
    document.getElementById("btn-add-entry").addEventListener("click", function () {
      Forms.showForm(null);
    });

    // 筛选
    var filterType = document.getElementById("filter-type");
    var filterMonth = document.getElementById("filter-month");
    if (filterType) {
      filterType.addEventListener("change", function () {
        Forms.renderEntryList(this.value, filterMonth ? filterMonth.value : "all");
      });
    }
    if (filterMonth) {
      filterMonth.addEventListener("change", function () {
        Forms.renderEntryList(filterType ? filterType.value : "all", this.value);
      });
    }

    // 7. 在线/离线检测
    window.addEventListener("online", function () {
      UI.updateSyncBar();
      Sync.fullSync().then(function () { self.refreshAll(); });
    });
    window.addEventListener("offline", function () {
      UI.updateSyncBar();
    });

    // 8. 初始渲染
    await this.refreshAll();

    // 9. 初始同步
    if (navigator.onLine) {
      Sync.fullSync().then(function () { self.refreshAll(); });
    }

    // 10. 定时同步（每 30 秒）
    setInterval(function () {
      if (navigator.onLine && Sync.enabled) {
        Sync.fullSync().then(function () { self.refreshAll(); });
      }
    }, 30000);
  },

  // 刷新所有视图
  async refreshAll() {
    await UI.updateSyncBar();

    if (this.currentTab === "entry") {
      var filterType = document.getElementById("filter-type");
      var filterMonth = document.getElementById("filter-month");
      await Forms.updateMonthFilter();
      await Forms.renderEntryList(
        filterType ? filterType.value : "all",
        filterMonth ? filterMonth.value : "all"
      );
    } else {
      await this.refreshStatements();
    }
  },

  // 根据周期获取趋势数据
  _getTrendData(entries, period, posType, negType) {
    var now = new Date();
    switch (period) {
      case "week":
        return Statements.getDailyTrend(entries, TimeViews.getWeekRange(now), posType, negType);
      case "month":
        return Statements.getWeeklyTrend(entries, TimeViews.getMonthRange(now), posType, negType);
      case "year":
      case "all":
      default:
        return Statements.getMonthlyTrend(entries, TimeViews.getYearRange(now), posType, negType);
    }
  },

  // 刷新报表
  async refreshStatements() {
    var period = this.currentPeriod;
    var entries = await DB.getAllEntries();
    var filtered = TimeViews.filterByPeriod(entries, period);

    // 获取上一周期数据进行对比
    var prevRange = TimeViews.getPreviousPeriodRange(period);
    var previousEntries = [];
    if (prevRange) {
      previousEntries = entries.filter(function (e) {
        return e.date >= prevRange.start && e.date <= prevRange.end;
      });
    }

    var prevLabel = TimeViews.getPeriodLabel(period);

    // 资产负债表
    var balanceData = Statements.calculateBalanceSheet(filtered);
    UI.renderBalanceTable(balanceData);
    Charts.updateBalanceChart(balanceData, period);

    if (prevRange) {
      var prevBalance = Statements.calculateBalanceSheet(previousEntries);
      UI.renderComparison("balance-comparison", balanceData.netWorth, prevBalance.netWorth, prevLabel);
    }

    // 收入支出表
    var incomeData = Statements.calculateIncomeStatement(filtered);
    UI.renderIncomeTable(incomeData);
    Charts.updateIncomeChart(incomeData, period);

    // 收入趋势图（本周每日/本月每周/本年每月）
    var incomeTrend = this._getTrendData(filtered, period, "income", "expense");
    Charts.updateIncomeTrend(incomeTrend, period);

    if (prevRange) {
      var prevIncome = Statements.calculateIncomeStatement(previousEntries);
      UI.renderComparison("income-comparison", incomeData.netIncome, prevIncome.netIncome, prevLabel);
    }

    // 现金流表
    var cashflowData = Statements.calculateCashFlow(filtered);
    UI.renderCashflowTable(cashflowData);
    Charts.updateCashflowChart(cashflowData, period);

    // 现金流趋势图
    var cashflowTrend = this._getTrendData(filtered, period, "cash_inflow", "cash_outflow");
    Charts.updateCashflowTrend(cashflowTrend, period);

    if (prevRange) {
      var prevCashflow = Statements.calculateCashFlow(previousEntries);
      UI.renderComparison("cashflow-comparison", cashflowData.netCashFlow, prevCashflow.netCashFlow, prevLabel);
    }
  },
};

// 启动应用
document.addEventListener("DOMContentLoaded", function () {
  App.init().catch(function (err) {
    console.error("App init failed:", err);
    alert("应用启动失败: " + err.message);
  });
});
