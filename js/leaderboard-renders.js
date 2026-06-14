(function() {
  const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  const Renders = {
    // 渲染個人總榜
    renderPersonal(container, rankBlock, allRecords, currentUser) {
      const personMap = {};
      allRecords.forEach(row => {
        if (!row || !row.grade_class || !row.seat_number) return;
        const key = `${row.grade_class}:${row.seat_number}`;
        if (!personMap[key]) {
          personMap[key] = {
            grade_class: row.grade_class,
            seat_number: row.seat_number,
            nickname: row.nickname || '特工',
            total_stars: 0,
            total_time: 0,
            mission_count: 0
          };
        }
        personMap[key].total_stars += row.stars || 0;
        if (row.best_avg_time && row.best_avg_time < 999) {
          personMap[key].total_time += row.best_avg_time;
          personMap[key].mission_count += 1;
        }
      });

      const personalList = Object.values(personMap).map(p => {
        return {
          grade_class: p.grade_class,
          seat_number: p.seat_number,
          nickname: p.nickname,
          total_stars: p.total_stars,
          avg_time: p.mission_count > 0 ? parseFloat((p.total_time / p.mission_count).toFixed(2)) : 99.9
        };
      });

      personalList.sort((a, b) => {
        if (b.total_stars !== a.total_stars) {
          return b.total_stars - a.total_stars;
        }
        return a.avg_time - b.avg_time;
      });

      // 我的排名
      if (rankBlock) {
        rankBlock.classList.remove('hidden');
        if (!currentUser) {
          rankBlock.innerHTML = `<div>👤 尚未建立特工身分，無法查看您的排行</div>`;
        } else {
          const myRank = personalList.findIndex(p => p.grade_class === currentUser.grade_class && p.seat_number === currentUser.seat_number);
          if (myRank === -1) {
            rankBlock.innerHTML = `<div>👤 特工 ${escapeHtml(currentUser.nickname)} | 尚未進入個人總榜（需至少通關一小關）</div>`;
          } else {
            const myRec = personalList[myRank];
            rankBlock.innerHTML = `
              <div>👤 我的名次：第 <span class="text-green-400 font-bold">${myRank + 1}</span> 名</div>
              <div>成績：<span class="text-green-400 font-bold">${myRec.total_stars} ⭐</span> (${myRec.avg_time.toFixed(2)}s)</div>
            `;
          }
        }
      }

      // 排行列表
      if (personalList.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">暫無數據，新賽季等待全台強者開拓！</div>`;
        return;
      }

      const top50 = personalList.slice(0, 50);
      container.innerHTML = top50.map((row, idx) => {
        const rank = idx + 1;
        const icon = RANK_ICONS[rank] || `#${rank}`;
        const isTop3 = rank <= 3;
        const isMe = currentUser && row.grade_class === currentUser.grade_class && row.seat_number === currentUser.seat_number;
        const rankClass = rank === 1 ? 'text-yellow-400 font-bold' : rank === 2 ? 'text-slate-300 font-bold' : rank === 3 ? 'text-orange-400 font-bold' : 'text-slate-500';
        const meBorderClass = isMe ? 'border-2 border-cyan-500 bg-cyan-950/20 shadow-[0_0_8px_rgba(0,240,255,0.2)]' : 'border-b border-slate-900/50 hover:bg-slate-800/10';

        return `
          <div class="leaderboard-row ${isTop3 ? 'leaderboard-row-top' : ''} ${meBorderClass} flex justify-between items-center py-2 px-3 text-xs font-pixel">
            <div class="flex items-center gap-2">
              <span class="leaderboard-rank w-6 text-center ${rankClass}">${icon}</span>
              <span class="text-slate-400 text-[9px] font-tech">[${row.grade_class}班 ${row.seat_number}號]</span>
              <span class="text-white text-[11px] font-bold">${escapeHtml(row.nickname)}</span>
              ${isMe ? '<span class="text-[8px] bg-cyan-500 text-black px-1 font-bold rounded">我</span>' : ''}
            </div>
            <div class="text-right">
              <span class="text-green-400 font-bold">${row.total_stars}⭐</span>
              <span class="text-slate-500 text-[9px] font-tech ml-1">(${row.avg_time.toFixed(2)}s)</span>
            </div>
          </div>
        `;
      }).join('');
    },

    // 渲染團隊對抗榜
    renderTeam(container, rankBlock, allRecords, currentUser) {
      const teamMap = {};
      allRecords.forEach(row => {
        if (!row || !row.grade_class) return;
        const cls = row.grade_class;
        if (!teamMap[cls]) {
          teamMap[cls] = {
            grade_class: cls,
            total_stars: 0,
            total_time: 0,
            record_count: 0,
            players: new Set()
          };
        }
        teamMap[cls].total_stars += row.stars || 0;
        if (row.best_avg_time && row.best_avg_time < 999) {
          teamMap[cls].total_time += row.best_avg_time;
          teamMap[cls].record_count += 1;
        }
        if (row.seat_number) {
          g = teamMap[cls].players.add(row.seat_number);
        }
      });

      const teamList = Object.values(teamMap).map(g => {
        return {
          grade_class: g.grade_class,
          total_stars: g.total_stars,
          avg_time: g.record_count > 0 ? parseFloat((g.total_time / g.record_count).toFixed(2)) : 99.9,
          player_count: g.players.size
        };
      });

      teamList.sort((a, b) => {
        if (b.total_stars !== a.total_stars) {
          return b.total_stars - a.total_stars;
        }
        return a.avg_time - b.avg_time;
      });

      if (rankBlock) {
        rankBlock.classList.remove('hidden');
        if (!currentUser) {
          rankBlock.innerHTML = `<div>👥 尚未建立特工身分，無法查看您的班級排行</div>`;
        } else {
          const myTeamRank = teamList.findIndex(g => g.grade_class === currentUser.grade_class);
          if (myTeamRank === -1) {
            rankBlock.innerHTML = `<div>👥 特工班級 ${escapeHtml(currentUser.grade_class)} | 尚未進入團隊對抗榜</div>`;
          } else {
            const myTeamRec = teamList[myTeamRank];
            rankBlock.innerHTML = `
              <div>👥 我班排名：第 <span class="text-green-400 font-bold">${myTeamRank + 1}</span> 名 (${myTeamRec.grade_class}班)</div>
              <div>團隊星星：<span class="text-green-400 font-bold">${myTeamRec.total_stars} ⭐</span> | 均速：${myTeamRec.avg_time}s | 人數：${myTeamRec.player_count}人</div>
            `;
          }
        }
      }

      if (teamList.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">暫無數據，新賽季等待全台團隊開拓！</div>`;
        return;
      }

      const top50Teams = teamList.slice(0, 50);
      container.innerHTML = top50Teams.map((row, idx) => {
        const rank = idx + 1;
        const icon = RANK_ICONS[rank] || `#${rank}`;
        const isTop3 = rank <= 3;
        const isMyTeam = currentUser && row.grade_class === currentUser.grade_class;
        const rankClass = rank === 1 ? 'text-yellow-400 font-bold' : rank === 2 ? 'text-slate-300 font-bold' : rank === 3 ? 'text-orange-400 font-bold' : 'text-slate-500';
        const meBorderClass = isMyTeam ? 'border-2 border-cyan-500 bg-cyan-950/20 shadow-[0_0_8px_rgba(0,240,255,0.2)]' : 'border-b border-slate-900/50 hover:bg-slate-800/10';

        return `
          <div class="leaderboard-row ${isTop3 ? 'leaderboard-row-top' : ''} ${meBorderClass} flex justify-between items-center py-2 px-3 text-xs font-pixel">
            <div class="flex items-center gap-2">
              <span class="leaderboard-rank w-6 text-center ${rankClass}">${icon}</span>
              <span class="text-white text-[11px] font-bold">${row.grade_class} 班級團隊</span>
              ${isMyTeam ? '<span class="text-[8px] bg-cyan-500 text-black px-1 font-bold rounded">我班</span>' : ''}
              <span class="text-slate-500 text-[8px] font-tech">(${row.player_count} 人參賽)</span>
            </div>
            <div class="text-right">
              <span class="text-green-400 font-bold">${row.total_stars}⭐</span>
              <span class="text-slate-500 text-[9px] font-tech ml-1">(團隊均速: ${row.avg_time}s)</span>
            </div>
          </div>
        `;
      }).join('');
    },

    // 渲染答題速度榜
    renderMission(container, rankBlock, allRecords, currentUser, currentMission) {
      let missionData = allRecords.filter(item => item && parseInt(item.mission_id) === currentMission);

      missionData.sort((a, b) => {
        const timeA = a.best_avg_time || 999;
        const timeB = b.best_avg_time || 999;
        return timeA - timeB;
      });

      if (rankBlock) {
        rankBlock.classList.remove('hidden');
        if (!currentUser) {
          rankBlock.innerHTML = `<div>🎯 尚未建立特工身分，無法查看您的速度排行</div>`;
        } else {
          const myMissionRank = missionData.findIndex(r => r.grade_class === currentUser.grade_class && r.seat_number === currentUser.seat_number);
          if (myMissionRank === -1) {
            rankBlock.innerHTML = `<div>🎯 特工 ${escapeHtml(currentUser.nickname)} | 本關卡（Mission ${currentMission}）尚未進入答題速度榜</div>`;
          } else {
            const myRec = missionData[myMissionRank];
            const myAvg = typeof myRec.best_avg_time === 'number' ? myRec.best_avg_time.toFixed(2) : '99.90';
            rankBlock.innerHTML = `
              <div class="w-full text-center">🎯 ${myMissionRank + 1} ${escapeHtml(currentUser.nickname)} ${currentUser.grade_class} ${myAvg}s</div>
            `;
          }
        }
      }

      if (missionData.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">該任務目前尚無挑戰數據，等待強者開拓！</div>`;
        return;
      }

      const top50Missions = missionData.slice(0, 50);
      container.innerHTML = top50Missions.map((row, idx) => {
        const rank = idx + 1;
        const icon = RANK_ICONS[rank] || `#${rank}`;
        const isTop3 = rank <= 3;
        const isMe = currentUser && row.grade_class === currentUser.grade_class && row.seat_number === currentUser.seat_number;
        const rankClass = rank === 1 ? 'text-yellow-400 font-bold' : rank === 2 ? 'text-slate-300 font-bold' : rank === 3 ? 'text-orange-400 font-bold' : 'text-slate-500';
        const meBorderClass = isMe ? 'border-2 border-cyan-500 bg-cyan-950/20 shadow-[0_0_8px_rgba(0,240,255,0.2)]' : 'border-b border-slate-900/50 hover:bg-slate-800/10';

        const avgTime = typeof row.best_avg_time === 'number' ? row.best_avg_time.toFixed(2) : '99.90';
        const minTime = typeof row.min_time === 'number' ? row.min_time.toFixed(2) : '99.90';

        return `
          <div class="leaderboard-row ${isTop3 ? 'leaderboard-row-top' : ''} ${meBorderClass} flex justify-between items-center py-2 px-3 text-xs font-pixel">
            <div class="flex items-center gap-2">
              <span class="leaderboard-rank w-6 text-center ${rankClass}">${icon}</span>
              <span class="text-slate-400 text-[9px] font-tech">[${row.grade_class}班 ${row.seat_number}號]</span>
              <span class="text-white text-[11px] font-bold">${escapeHtml(row.nickname)}</span>
              ${isMe ? '<span class="text-[8px] bg-cyan-500 text-black px-1 font-bold rounded">我</span>' : ''}
            </div>
            <div class="text-right flex items-center gap-3">
              <span class="text-green-400 font-bold">均速: ${avgTime}s</span>
              <span class="text-cyan-400 text-[9px] font-tech">最快: ${minTime}s</span>
            </div>
          </div>
        `;
      }).join('');
    }
  };

  window.MathSprintLeaderboardRenders = Renders;
})();
