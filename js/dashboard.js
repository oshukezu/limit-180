// MathSprint Parental Dashboard Visualizations Module (Missions Edition)
// Renders Cyberpunk-styled radar and line charts utilizing Chart.js.

(function() {
  let radarChartInstance = null;
  let lineChartInstance = null;

  // Categorize level sessions based on Mission category
  // Returns average time spent in seconds for each category
  function getRadarData(historyLog) {
    const categories = {
      '加減算力': { missions: [1, 4, 5], totalTime: 0, count: 0 },
      '乘除算力': { missions: [2, 3, 6], totalTime: 0, count: 0 },
      '混合運算': { missions: [7], totalTime: 0, count: 0 },
      '數值直覺': { missions: [8], totalTime: 0, count: 0 },
      '代數與負數': { missions: [9], totalTime: 0, count: 0 },
      '傳奇綜合算力': { missions: [10], totalTime: 0, count: 0 }
    };

    historyLog.forEach(session => {
      // Compatibility fallback: if session.mission is not present, use session.level as mission
      const missionId = session.mission !== undefined ? session.mission : session.level;
      
      for (const catName in categories) {
        if (categories[catName].missions.includes(missionId)) {
          categories[catName].totalTime += session.avgTime;
          categories[catName].count++;
        }
      }
    });

    const labels = Object.keys(categories);
    const data = labels.map(label => {
      const cat = categories[label];
      return cat.count > 0 ? parseFloat((cat.totalTime / cat.count).toFixed(2)) : 0;
    });

    const hasData = data.some(val => val > 0);

    return { labels, data, hasData };
  }

  // Aggregate past 7 days average reaction times
  function getLineData(historyLog) {
    const days = [];
    const dateLabels = [];
    const avgTimes = [];

    // Prepopulate past 7 dates
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push(dateStr);
      const parts = dateStr.split('-');
      dateLabels.push(`${parts[1]}/${parts[2]}`);
    }

    days.forEach(dayStr => {
      const sessionsOnDay = historyLog.filter(s => s.date === dayStr);
      if (sessionsOnDay.length > 0) {
        const sum = sessionsOnDay.reduce((acc, s) => acc + s.avgTime, 0);
        avgTimes.push(parseFloat((sum / sessionsOnDay.length).toFixed(2)));
      } else {
        avgTimes.push(null);
      }
    });

    const hasData = avgTimes.some(val => val !== null);

    return { labels: dateLabels, data: avgTimes, hasData };
  }

  const Dashboard = {
    renderCharts() {
      const profile = window.MathSprintStorage.getProfile();
      const historyLog = profile.history_log || [];

      this.destroyCharts();

      // 1. Radar Chart Setup
      const radarDataObj = getRadarData(historyLog);
      const radarCtx = document.getElementById('radar-chart').getContext('2d');
      const radarNoData = document.getElementById('radar-no-data');

      if (!radarDataObj.hasData) {
        radarNoData.classList.remove('hidden');
      } else {
        radarNoData.classList.add('hidden');
        
        radarChartInstance = new Chart(radarCtx, {
          type: 'radar',
          data: {
            labels: radarDataObj.labels,
            datasets: [{
              label: '平均單題反應時間 (秒，越低越快)',
              data: radarDataObj.data,
              backgroundColor: 'rgba(0, 240, 255, 0.2)',
              borderColor: '#00f0ff',
              borderWidth: 2,
              pointBackgroundColor: '#ff007f',
              pointBorderColor: '#fff',
              pointRadius: 4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              r: {
                angleLines: { color: '#1f2937' },
                grid: { color: '#1f2937' },
                pointLabels: {
                  color: '#9ca3af',
                  font: { family: 'Share Tech Mono', size: 10 }
                },
                ticks: {
                  backdropColor: 'transparent',
                  color: '#6b7280',
                  font: { family: 'Share Tech Mono' }
                },
                suggestedMin: 0,
                suggestedMax: 6
              }
            },
            plugins: {
              legend: {
                labels: {
                  color: '#e2e8f0',
                  font: { family: 'Share Tech Mono' }
                }
              }
            }
          }
        });
      }

      // 2. Line Chart Setup
      const lineDataObj = getLineData(historyLog);
      const lineCtx = document.getElementById('line-chart').getContext('2d');
      const lineNoData = document.getElementById('line-no-data');

      if (!lineDataObj.hasData) {
        lineNoData.classList.remove('hidden');
      } else {
        lineNoData.classList.add('hidden');

        lineChartInstance = new Chart(lineCtx, {
          type: 'line',
          data: {
            labels: lineDataObj.labels,
            datasets: [{
              label: '單題平均耗時 (秒)',
              data: lineDataObj.data,
              borderColor: '#ff007f',
              backgroundColor: 'rgba(255, 0, 127, 0.05)',
              borderWidth: 3,
              pointBackgroundColor: '#39ff14',
              pointBorderColor: '#fff',
              pointRadius: 5,
              spanGaps: true,
              tension: 0.3
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { color: '#1f2937' },
                ticks: {
                  color: '#9ca3af',
                  font: { family: 'Share Tech Mono' }
                }
              },
              y: {
                grid: { color: '#1f2937' },
                ticks: {
                  color: '#9ca3af',
                  font: { family: 'Share Tech Mono' }
                },
                title: {
                  display: true,
                  text: '反應秒數',
                  color: '#6b7280',
                  font: { family: 'Share Tech Mono' }
                },
                suggestedMin: 0
              }
            },
            plugins: {
              legend: {
                labels: {
                  color: '#e2e8f0',
                  font: { family: 'Share Tech Mono' }
                }
              }
            }
          }
        });
      }
    },

    destroyCharts() {
      if (radarChartInstance) {
        radarChartInstance.destroy();
        radarChartInstance = null;
      }
      if (lineChartInstance) {
        lineChartInstance.destroy();
        lineChartInstance = null;
      }
    },

    init() {
      document.getElementById('dashboard-reset-btn').addEventListener('click', () => {
        if (confirm('☠️ 警告：這將永久刪除您的所有大關卡記錄、錯題本、歷史戰績與成就記錄！此操作無法復原。您確定要重設存檔嗎？')) {
          window.MathSprintStorage.resetProfile();
          alert('存檔已重設！');
          window.location.reload();
        }
      });
    }
  };

  // Export
  window.MathSprintDashboard = Dashboard;

  window.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
  });
})();
