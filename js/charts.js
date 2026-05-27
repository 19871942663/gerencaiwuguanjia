// charts.js — Chart.js 图表初始化和更新
const Charts = {
  balanceChart: null,
  incomeChart: null,
  cashflowChart: null,

  // 创建/更新资产负债表图表
  updateBalanceChart(data, period) {
    var canvas = document.getElementById("balance-chart");
    var container = canvas.parentElement;
    if (!data || (data.totalAssets === 0 && data.totalLiabilities === 0)) {
      container.style.display = "none";
      return;
    }
    container.style.display = "block";

    if (this.balanceChart) this.balanceChart.destroy();
    var ctx = canvas.getContext("2d");

    this.balanceChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["总资产", "总负债", "净资产"],
        datasets: [{
          label: "金额 (元)",
          data: [data.totalAssets, data.totalLiabilities, data.netWorth],
          backgroundColor: ["#059669", "#DC2626", "#2563EB"],
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (v) { return "¥" + v.toLocaleString(); },
            },
          },
        },
      },
    });
  },

  // 创建/更新收入支出图表
  updateIncomeChart(data, period) {
    var canvas = document.getElementById("income-chart");
    var container = canvas.parentElement;
    if (!data || (data.totalIncome === 0 && data.totalExpenses === 0)) {
      container.style.display = "none";
      return;
    }
    container.style.display = "block";

    if (this.incomeChart) this.incomeChart.destroy();
    var ctx = canvas.getContext("2d");

    // 按分类汇总
    var incomeGroups = Statements.groupByCategory(data.incomeItems);
    var expenseGroups = Statements.groupByCategory(data.expenseItems);

    var incomeLabels = Object.keys(incomeGroups);
    var incomeValues = Object.values(incomeGroups);
    var expenseLabels = Object.keys(expenseGroups);
    var expenseValues = Object.values(expenseGroups);

    this.incomeChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["总收入", "总支出", "净收入"],
        datasets: [{
          label: "金额 (元)",
          data: [data.totalIncome, data.totalExpenses, data.netIncome],
          backgroundColor: ["#059669", "#DC2626", "#2563EB"],
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (v) { return "¥" + v.toLocaleString(); },
            },
          },
        },
      },
    });
  },

  // 收入趋势图（本周每日/本月每周/本年每月）
  incomeTrendChart: null,
  updateIncomeTrend(trendData, period) {
    var canvas = document.getElementById("income-trend-chart");
    var section = document.getElementById("income-trend-section");
    var title = document.getElementById("income-trend-title");
    if (!canvas) return;

    // 更新标题
    var titles = { week: "每日收支趋势", month: "每周收支趋势", year: "每月收支趋势", all: "每月收支趋势" };
    title.textContent = titles[period] || "收支趋势";

    var hasData = false;
    for (var i = 0; i < trendData.incomeData.length; i++) {
      if (trendData.incomeData[i] > 0 || trendData.expenseData[i] > 0) { hasData = true; break; }
    }
    if (!hasData) {
      section.style.display = "none";
      return;
    }
    section.style.display = "block";

    if (this.incomeTrendChart) this.incomeTrendChart.destroy();
    var ctx = canvas.getContext("2d");

    this.incomeTrendChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: trendData.labels,
        datasets: [
          {
            label: "收入",
            data: trendData.incomeData,
            backgroundColor: "#059669",
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: "支出",
            data: trendData.expenseData,
            backgroundColor: "#DC2626",
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "bottom", labels: { boxWidth: 12, padding: 16 } },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: function (v) { return "¥" + v.toLocaleString(); } },
          },
        },
      },
    });
  },

  // 现金流趋势图
  cashflowTrendChart: null,
  updateCashflowTrend(trendData, period) {
    var canvas = document.getElementById("cashflow-trend-chart");
    var section = document.getElementById("cashflow-trend-section");
    var title = document.getElementById("cashflow-trend-title");
    if (!canvas) return;

    var titles = { week: "每日现金流趋势", month: "每周现金流趋势", year: "每月现金流趋势", all: "每月现金流趋势" };
    title.textContent = titles[period] || "现金流趋势";

    var hasData = false;
    for (var i = 0; i < trendData.incomeData.length; i++) {
      if (trendData.incomeData[i] > 0 || trendData.expenseData[i] > 0) { hasData = true; break; }
    }
    if (!hasData) {
      section.style.display = "none";
      return;
    }
    section.style.display = "block";

    if (this.cashflowTrendChart) this.cashflowTrendChart.destroy();
    var ctx = canvas.getContext("2d");

    this.cashflowTrendChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: trendData.labels,
        datasets: [
          {
            label: "流入",
            data: trendData.incomeData,
            backgroundColor: "#059669",
            borderRadius: 4,
            borderSkipped: false,
          },
          {
            label: "流出",
            data: trendData.expenseData,
            backgroundColor: "#DC2626",
            borderRadius: 4,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: "bottom", labels: { boxWidth: 12, padding: 16 } },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: function (v) { return "¥" + v.toLocaleString(); } },
          },
        },
      },
    });
  },

  // 创建/更新现金流图表
  updateCashflowChart(data, period) {
    var canvas = document.getElementById("cashflow-chart");
    var container = canvas.parentElement;
    if (!data || (data.totalInflow === 0 && data.totalOutflow === 0)) {
      container.style.display = "none";
      return;
    }
    container.style.display = "block";

    if (this.cashflowChart) this.cashflowChart.destroy();
    var ctx = canvas.getContext("2d");

    this.cashflowChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["总流入", "总流出", "净现金流"],
        datasets: [{
          label: "金额 (元)",
          data: [data.totalInflow, data.totalOutflow, data.netCashFlow],
          backgroundColor: ["#059669", "#DC2626", "#2563EB"],
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (v) { return "¥" + v.toLocaleString(); },
            },
          },
        },
      },
    });
  },
};
