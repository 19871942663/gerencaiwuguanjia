// statements.js — 三大财务报表计算逻辑
const Statements = {
  // 资产负债表: 总资产 - 总负债 = 净资产
  calculateBalanceSheet(entries) {
    var assetItems = [];
    var liabilityItems = [];
    var totalAssets = 0;
    var totalLiabilities = 0;

    entries.forEach(function (e) {
      if (e.type === "asset") {
        totalAssets += e.amount;
        assetItems.push(e);
      } else if (e.type === "liability") {
        totalLiabilities += e.amount;
        liabilityItems.push(e);
      }
    });

    return {
      assetItems: assetItems,
      liabilityItems: liabilityItems,
      totalAssets: totalAssets,
      totalLiabilities: totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
    };
  },

  // 收入支出表: 总收入 - 总支出 = 净收入
  calculateIncomeStatement(entries) {
    var incomeItems = [];
    var expenseItems = [];
    var totalIncome = 0;
    var totalExpenses = 0;

    entries.forEach(function (e) {
      if (e.type === "income") {
        totalIncome += e.amount;
        incomeItems.push(e);
      } else if (e.type === "expense") {
        totalExpenses += e.amount;
        expenseItems.push(e);
      }
    });

    return {
      incomeItems: incomeItems,
      expenseItems: expenseItems,
      totalIncome: totalIncome,
      totalExpenses: totalExpenses,
      netIncome: totalIncome - totalExpenses,
    };
  },

  // 现金流表: 总流入 - 总流出 = 净现金流
  calculateCashFlow(entries) {
    var inflowItems = [];
    var outflowItems = [];
    var totalInflow = 0;
    var totalOutflow = 0;

    entries.forEach(function (e) {
      if (e.type === "cash_inflow") {
        totalInflow += e.amount;
        inflowItems.push(e);
      } else if (e.type === "cash_outflow") {
        totalOutflow += e.amount;
        outflowItems.push(e);
      }
    });

    return {
      inflowItems: inflowItems,
      outflowItems: outflowItems,
      totalInflow: totalInflow,
      totalOutflow: totalOutflow,
      netCashFlow: totalInflow - totalOutflow,
    };
  },

  // ===== 趋势分解：按时间段内子周期汇总 =====

  // 本周 → 按天分解（周一到周日）
  getDailyTrend(entries, weekRange) {
    var dayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
    var incomeByDay = [0, 0, 0, 0, 0, 0, 0];
    var expenseByDay = [0, 0, 0, 0, 0, 0, 0];

    var posType = arguments[2] || "income";
    var negType = arguments[3] || "expense";

    entries.forEach(function (e) {
      var d = new Date(e.date + "T00:00:00");
      var dayIndex = d.getDay();
      dayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
      if (e.type === posType) incomeByDay[dayIndex] += e.amount;
      if (e.type === negType) expenseByDay[dayIndex] += e.amount;
    });

    return { labels: dayNames, incomeData: incomeByDay, expenseData: expenseByDay };
  },

  // 本月 → 按周分解（第1周~第4/5周）
  getWeeklyTrend(entries, monthRange) {
    var weeks = [];
    var monthStart = new Date(monthRange.start + "T00:00:00");
    var monthEnd = new Date(monthRange.end + "T00:00:00");

    // 计算本月有几周
    var currentWeekStart = new Date(monthStart);
    var weekNum = 1;
    while (currentWeekStart <= monthEnd) {
      var weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      if (weekEnd > monthEnd) weekEnd = new Date(monthEnd);
      weeks.push({
        label: "第" + weekNum + "周",
        start: this._fmt(currentWeekStart),
        end: this._fmt(weekEnd),
      });
      weekNum++;
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    var incomeByWeek = new Array(weeks.length).fill(0);
    var expenseByWeek = new Array(weeks.length).fill(0);

    var posType = arguments[2] || "income";
    var negType = arguments[3] || "expense";

    entries.forEach(function (e) {
      for (var i = 0; i < weeks.length; i++) {
        if (e.date >= weeks[i].start && e.date <= weeks[i].end) {
          if (e.type === posType) incomeByWeek[i] += e.amount;
          if (e.type === negType) expenseByWeek[i] += e.amount;
          break;
        }
      }
    });

    return {
      labels: weeks.map(function (w) { return w.label; }),
      incomeData: incomeByWeek,
      expenseData: expenseByWeek,
    };
  },

  // 本年 → 按月分解（1月~12月）
  getMonthlyTrend(entries, yearRange) {
    var monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
    var incomeByMonth = new Array(12).fill(0);
    var expenseByMonth = new Array(12).fill(0);

    var posType = arguments[2] || "income";
    var negType = arguments[3] || "expense";

    entries.forEach(function (e) {
      var monthIndex = parseInt(e.date.substring(5, 7)) - 1;
      if (e.type === posType) incomeByMonth[monthIndex] += e.amount;
      if (e.type === negType) expenseByMonth[monthIndex] += e.amount;
    });

    return { labels: monthNames, incomeData: incomeByMonth, expenseData: expenseByMonth };
  },

  // 按分类汇总（用于图表展示）
  groupByCategory(entries) {
    var groups = {};
    entries.forEach(function (e) {
      if (!groups[e.category]) {
        groups[e.category] = 0;
      }
      groups[e.category] += e.amount;
    });
    return groups;
  },

  _fmt: function (d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  },
};
