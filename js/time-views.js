// time-views.js — 按周/月/年/全部筛选
const TimeViews = {
  // 获取某日期所在周的起止日期（周一到周日）
  getWeekRange(date) {
    var d = new Date(date);
    var day = d.getDay();
    var diff = d.getDate() - day + (day === 0 ? -6 : 1);
    var monday = new Date(d.setDate(diff));
    var sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: this._formatDate(monday),
      end: this._formatDate(sunday),
    };
  },

  // 获取某日期所在月的起止日期
  getMonthRange(date) {
    var d = new Date(date);
    var start = new Date(d.getFullYear(), d.getMonth(), 1);
    var end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return {
      start: this._formatDate(start),
      end: this._formatDate(end),
    };
  },

  // 获取某日期所在年的起止日期
  getYearRange(date) {
    var d = new Date(date);
    return {
      start: d.getFullYear() + "-01-01",
      end: d.getFullYear() + "-12-31",
    };
  },

  // 按周期筛选
  filterByPeriod(entries, period) {
    if (period === "all" || !period) return entries;
    var now = new Date();
    var range;
    switch (period) {
      case "week":  range = this.getWeekRange(now); break;
      case "month": range = this.getMonthRange(now); break;
      case "year":  range = this.getYearRange(now); break;
      default:      return entries;
    }
    return entries.filter(function (e) {
      return e.date >= range.start && e.date <= range.end;
    });
  },

  // 获取上一周期范围（用于对比）
  getPreviousPeriodRange(period) {
    var now = new Date();
    var d;
    switch (period) {
      case "week":
        d = new Date(now);
        d.setDate(d.getDate() - 7);
        return this.getWeekRange(d);
      case "month":
        d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return this.getMonthRange(d);
      case "year":
        d = new Date(now.getFullYear() - 1, 0, 1);
        return this.getYearRange(d);
      default:
        return null;
    }
  },

  // 获取周期中文名
  getPeriodLabel(period) {
    var map = { week: "上周", month: "上月", year: "去年", all: "" };
    return map[period] || "";
  },

  // 格式化日期
  _formatDate(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, "0");
    var d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  },
};
