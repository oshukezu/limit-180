(function() {
  const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  function formatLeaderboardCoins(value) {
    const val = Number(value) || 0;
    if (val < 10000) return val.toLocaleString('zh-TW') + ' 💰';
    if (val < 1000000) return ((val / 10000) % 1 === 0 ? val / 10000 : (val / 10000).toFixed(1)) + '萬 💰';
    return ((val / 1000000) % 1 === 0 ? val / 1000000 : (val / 1000000).toFixed(1)) + 'M 💰';
  }

  function getBaseCoin(m) {
    const arr = [[5, 200], [10, 300], [15, 1000], [20, 2000], [25, 5000], [30, 10000], [35, 20000], [40, 40000], [44, 100000], [47, 250000], [49, 500000]];
    const found = arr.find(([limit]) => m <= limit);
    return found ? found[1] : 0;
  }

  function estimateHighestLevel(mission, stars) {
    const total = Math.max(0, Number(stars || 0));
    if (total <= 0) return 0;
    let acc = 0;
    for (let level = 1; level <= 20; level++) {
      const oneStar = mission === 50 ? 500000 * level : Math.floor(getBaseCoin(mission) * level / 3);
      acc += Math.max(1, oneStar);
      if (total < acc) return Math.max(1, level - 1);
    }
    return 20;
  }

  const Renders = {
    // 渲染個人總榜
    renderPersonal(container, rankBlock, allRecords, currentUser, globalRows = []) {
      const personMap = {};
      const ensurePerson = (gradeClass, seatNumber, nickname) => {
        const key = `${gradeClass}:${seatNumber}`;
        if (!personMap[key]) {
          personMap[key] = {
            grade_class: gradeClass,
            seat_number: seatNumber,
            nickname: nickname || '特工',
            total_stars: 0,
            total_time: 0,
            mission_count: 0,
            max_mission: 1,
            max_level: 1
          };
        }
        return personMap[key];
      };
      allRecords.forEach(row => {
        if (!row || !row.grade_class || !row.seat_number) return;
        const person = ensurePerson(row.grade_class, row.seat_number, row.nickname);
        person.total_stars += row.stars || 0;
        const missionId = Number(row.mission_id || 0);
        const estimatedLevel = estimateHighestLevel(missionId, row.stars);
        if (missionId > 0 && estimatedLevel > 0) {
          if (missionId > person.max_mission || (missionId === person.max_mission && estimatedLevel > person.max_level)) {
            person.max_mission = missionId;
            person.max_level = estimatedLevel;
          }
        }
        if (row.best_avg_time && row.best_avg_time < 999) {
          person.total_time += row.best_avg_time;
          person.mission_count += 1;
        }
      });
      globalRows.forEach(row => {
        if (!row || !row.grade_class || !row.seat_number) return;
        const person = ensurePerson(row.grade_class, row.seat_number, row.nickname);
        const purchased = Array.isArray(row.purchased_missions) ? row.purchased_missions.map(Number).filter(Boolean) : [];
        const maxPurchased = purchased.length ? Math.max(...purchased) : 0;
        if (maxPurchased > person.max_mission) {
          person.max_mission = maxPurchased;
          person.max_level = 1;
        }
      });

      // 取得當前特工本機實際最高關卡與小關卡
      let localMaxMission = 1;
      let localMaxLevel = 1;
      if (window.MathSprintStorage) {
        const localProfile = window.MathSprintStorage.getProfile();
        if (localProfile) {
          const configs = window.MathSprintConfigs?.MISSION_CONFIGS || {};
          const missionCount = Object.keys(configs).length || 50;
          for (let m = 1; m <= missionCount; m++) {
            if (window.MathSprintStorage.isMissionUnlocked(m, localProfile)) {
              localMaxMission = m;
            }
          }
          Object.keys(localProfile.level_records || {}).forEach((key) => {
            const m = key.match(/mission-(\d+)-level-(\d+)/);
            if (!m || !localProfile.level_records[key]?.is_passed) return;
            const mi = parseInt(m[1], 10), lv = parseInt(m[2], 10);
            if (mi === localMaxMission && lv > localMaxLevel) {
              localMaxLevel = lv;
            }
          });
        }
      }

      const personalList = Object.values(personMap).map(p => {
        const isMe = currentUser && p.grade_class === currentUser.grade_class && String(p.seat_number) === String(currentUser.seat_number);
        return {
          grade_class: p.grade_class,
          seat_number: p.seat_number,
          nickname: p.nickname,
          total_stars: p.total_stars,
          max_mission: isMe ? localMaxMission : p.max_mission,
          max_level: isMe ? localMaxLevel : p.max_level,
          avg_time: p.mission_count > 0 ? parseFloat((p.total_time / p.mission_count).toFixed(2)) : 99.9
        };
      });

      personalList.sort((a, b) => {
        if (b.max_mission !== a.max_mission) {
          return b.max_mission - a.max_mission;
        }
        if (b.max_level !== a.max_level) {
          return b.max_level - a.max_level;
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
              <div class="w-full flex flex-col gap-1">
                <div>👤 我的名次：第 <span class="text-green-400 font-bold">${myRank + 1}</span> 名</div>
                <div class="text-slate-400 text-[9px] font-tech mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                  <span>最高關卡：<span class="text-green-400 font-bold">M${myRec.max_mission || 1}L${myRec.max_level || 1}</span></span>
                  <span>均速：<span class="text-white">${myRec.avg_time.toFixed(2)}s</span></span>
                </div>
              </div>
            `;
          }
        }
      }

      // 排行列表
      if (personalList.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">暫無數據，新賽季等待全台強者開拓！</div>`;
        return;
      }

      const headerHtml = `
        <div class="flex justify-between items-center px-3 py-1 text-[9px] font-pixel text-slate-500 border-b border-slate-800/60 mb-1">
          <div class="flex items-center gap-2">
            <span class="w-6 text-center">排名</span>
            <span>特工資訊</span>
          </div>
          <div class="text-right flex items-center gap-3">
            <span class="min-w-[70px] text-right">最高關卡</span>
            <span class="min-w-[45px] text-right">平均速度</span>
          </div>
        </div>
      `;

      const top50 = personalList.slice(0, 50);
      container.innerHTML = headerHtml + top50.map((row, idx) => {
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
              <span class="text-slate-400 text-[9px] font-tech">${row.grade_class}班 ${row.seat_number}號</span>
              <span class="text-white text-[11px] font-bold">${escapeHtml(row.nickname)}</span>
              ${isMe ? '<span class="text-[8px] bg-cyan-500 text-black px-1 font-bold rounded">我</span>' : ''}
            </div>
            <div class="text-right flex items-center gap-3">
              <span class="text-green-400 font-bold min-w-[70px] text-right">M${row.max_mission || 1}L${row.max_level || 1}</span>
              <span class="text-slate-400 text-[9px] font-tech min-w-[45px] text-right">${row.avg_time.toFixed(2)}s</span>
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
              <div class="w-full flex flex-col gap-1">
                <div>👥 我班排名：第 <span class="text-green-400 font-bold">${myTeamRank + 1}</span> 名 (${myTeamRec.grade_class}班)</div>
                <div class="text-slate-400 text-[9px] font-tech mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                  <span>團隊獎金：<span class="text-green-400 font-bold">${formatLeaderboardCoins(myTeamRec.total_stars)}</span></span>
                  <span>均速：<span class="text-white">${myTeamRec.avg_time}s</span></span>
                  <span>人數：<span class="text-white">${myTeamRec.player_count}人</span></span>
                </div>
              </div>
            `;
          }
        }
      }

      if (teamList.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">暫無數據，新賽季等待全台團隊開拓！</div>`;
        return;
      }

      const headerHtml = `
        <div class="flex justify-between items-center px-3 py-1 text-[9px] font-pixel text-slate-500 border-b border-slate-800/60 mb-1">
          <div class="flex items-center gap-2">
            <span class="w-6 text-center">排名</span>
            <span>班級</span>
            <span class="ml-2">參賽人數</span>
          </div>
          <div class="text-right flex items-center gap-3">
            <span class="min-w-[70px] text-right">團隊獎金</span>
            <span class="min-w-[45px] text-right">團隊均速</span>
          </div>
        </div>
      `;

      const top50Teams = teamList.slice(0, 50);
      container.innerHTML = headerHtml + top50Teams.map((row, idx) => {
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
              <span class="text-white text-[11px] font-bold">${row.grade_class}</span>
              ${isMyTeam ? '<span class="text-[8px] bg-cyan-500 text-black px-1 font-bold rounded">我班</span>' : ''}
              <span class="text-slate-500 text-[9px] font-tech ml-1">${row.player_count} 人</span>
            </div>
            <div class="text-right flex items-center gap-3">
              <span class="text-green-400 font-bold min-w-[70px] text-right">${formatLeaderboardCoins(row.total_stars)}</span>
              <span class="text-slate-400 text-[9px] font-tech min-w-[45px] text-right">${row.avg_time}s</span>
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
              <div class="w-full flex flex-col gap-1">
                <div>🎯 我的名次：第 <span class="text-green-400 font-bold">${myMissionRank + 1}</span> 名</div>
                <div class="text-slate-400 text-[9px] font-tech mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                  <span>特工：<span class="text-white">${escapeHtml(currentUser.nickname)}</span> (${currentUser.grade_class}班)</span>
                  <span>均速：<span class="text-green-400 font-bold">${myAvg}s</span></span>
                </div>
              </div>
            `;
          }
        }
      }

      if (missionData.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-500 font-pixel text-[10px] py-8">該任務目前尚無挑戰數據，等待強者開拓！</div>`;
        return;
      }

      const headerHtml = `
        <div class="flex justify-between items-center px-3 py-1 text-[9px] font-pixel text-slate-500 border-b border-slate-800/60 mb-1">
          <div class="flex items-center gap-2">
            <span class="w-6 text-center">排名</span>
            <span>特工資訊</span>
          </div>
          <div class="text-right flex items-center gap-3">
            <span class="min-w-[55px] text-right">平均速度</span>
            <span class="min-w-[55px] text-right">單題最快</span>
          </div>
        </div>
      `;

      const top50Missions = missionData.slice(0, 50);
      container.innerHTML = headerHtml + top50Missions.map((row, idx) => {
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
              <span class="text-slate-400 text-[9px] font-tech">${row.grade_class}班 ${row.seat_number}號</span>
              <span class="text-white text-[11px] font-bold">${escapeHtml(row.nickname)}</span>
              ${isMe ? '<span class="text-[8px] bg-cyan-500 text-black px-1 font-bold rounded">我</span>' : ''}
            </div>
            <div class="text-right flex items-center gap-3">
              <span class="text-green-400 font-bold min-w-[55px] text-right">${avgTime}s</span>
              <span class="text-cyan-400 text-[9px] font-tech min-w-[55px] text-right">${minTime}s</span>
            </div>
          </div>
        `;
      }).join('');
    }
  };

  window.MathSprintLeaderboardRenders = Renders;
})();
