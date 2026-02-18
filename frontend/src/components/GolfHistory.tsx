import React, { useState } from 'react';
import { GolfRoundSummary, GolfRound, GolfHoleResult } from '../types';
import { golfAPI } from '../services/api';

interface GolfHistoryProps {
  rounds: GolfRoundSummary[];
  onEditRound?: (roundId: number) => void;
}

const GolfHistory: React.FC<GolfHistoryProps> = ({ rounds, onEditRound }) => {
  const [expandedRoundId, setExpandedRoundId] = useState<number | null>(null);
  const [expandedRoundData, setExpandedRoundData] = useState<GolfRound | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const toggleExpand = async (roundId: number) => {
    if (expandedRoundId === roundId) {
      setExpandedRoundId(null);
      setExpandedRoundData(null);
      return;
    }

    try {
      setLoadingDetail(true);
      setExpandedRoundId(roundId);
      const data = await golfAPI.getRound(roundId);
      setExpandedRoundData(data);
    } catch (err) {
      console.error('Failed to load round detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getResultColor = (winnerTeam: number | null) => {
    if (winnerTeam === 1) return '#60a5fa';
    if (winnerTeam === 2) return '#f43f5e';
    return '#facc15';
  };

  if (rounds.length === 0) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-lg font-medium mb-4" style={{ color: '#f1f5f9' }}>Golf Round History</h2>
        <div className="text-center py-8">
          <p className="text-lg" style={{ color: '#94a3b8' }}>No golf rounds played yet.</p>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>Create your first round to see it appear here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg animate-fadeIn" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #334155' }}>
        <h2 className="text-lg font-medium" style={{ color: '#f1f5f9' }}>Golf Round History</h2>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          {rounds.length} round{rounds.length !== 1 ? 's' : ''} played
        </p>
      </div>

      <div>
        {rounds.map((round, index) => (
          <div key={round.id}>
            <div
              className="p-6 transition-colors"
              style={{
                backgroundColor: index % 2 === 0 ? '#1e293b' : '#162032',
                borderBottom: '1px solid #334155',
                cursor: 'pointer',
              }}
              onClick={() => toggleExpand(round.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-1">
                  <div className="text-sm" style={{ color: '#94a3b8' }}>
                    Round #{round.id} {formatDate(round.played_at)}
                  </div>
                  <div className="text-sm" style={{ color: '#94a3b8' }}>
                    {round.course}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium" style={{ color: getResultColor(round.winner_team) }}>
                    {round.winner_team ? `Team ${round.winner_team} Wins!` : 'Draw!'}
                  </div>
                  {onEditRound && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditRound(round.id); }}
                      style={{
                        color: '#f43f5e',
                        border: '1px solid rgba(244, 63, 94, 0.4)',
                        backgroundColor: 'transparent',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Team 1 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium" style={{ color: '#60a5fa' }}>Team 1</h3>
                    <span className="text-xl font-bold" style={{
                      color: round.team1_holes_won > round.team2_holes_won ? '#4ade80' : '#64748b'
                    }}>
                      {round.team1_holes_won}
                    </span>
                  </div>
                  <ul className="space-y-1 text-sm" style={{ color: '#cbd5e1' }}>
                    {round.team1_player_names.map((name, i) => (
                      <li key={i} className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#60a5fa' }}></span>
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center justify-center">
                  <div className="font-bold text-lg" style={{ color: '#475569' }}>VS</div>
                  <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                    {round.team1_holes_won}-{round.team2_holes_won}-{round.halved_holes}
                  </div>
                </div>

                {/* Team 2 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium" style={{ color: '#f43f5e' }}>Team 2</h3>
                    <span className="text-xl font-bold" style={{
                      color: round.team2_holes_won > round.team1_holes_won ? '#4ade80' : '#64748b'
                    }}>
                      {round.team2_holes_won}
                    </span>
                  </div>
                  <ul className="space-y-1 text-sm" style={{ color: '#cbd5e1' }}>
                    {round.team2_player_names.map((name, i) => (
                      <li key={i} className="flex items-center">
                        <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#f43f5e' }}></span>
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-2 text-center">
                <span className="text-xs" style={{ color: '#64748b' }}>
                  {expandedRoundId === round.id ? 'Click to collapse' : 'Click for hole-by-hole detail'}
                </span>
              </div>
            </div>

            {/* Expanded Hole Detail */}
            {expandedRoundId === round.id && (
              <div className="px-6 py-4" style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155' }}>
                {loadingDetail ? (
                  <div className="text-center py-4" style={{ color: '#94a3b8' }}>Loading hole details...</div>
                ) : expandedRoundData ? (
                  <div>
                    <h4 className="text-sm font-medium mb-3" style={{ color: '#f1f5f9' }}>Hole-by-Hole Results</h4>
                    {(() => {
                      const hasCourseData = expandedRoundData.hole_results.some(h => h.par != null);
                      const renderHoleGrid = (holes: typeof expandedRoundData.hole_results) => (
                        <div className="grid grid-cols-9 gap-1">
                          {holes.map((hole) => (
                            <div key={hole.hole_number} className="text-center p-2 rounded" style={{
                              backgroundColor: hole.winner_team === 1 ? 'rgba(96, 165, 250, 0.15)' :
                                              hole.winner_team === 2 ? 'rgba(244, 63, 94, 0.15)' :
                                              'rgba(250, 204, 21, 0.1)',
                              border: `1px solid ${hole.winner_team === 1 ? 'rgba(96, 165, 250, 0.3)' :
                                                  hole.winner_team === 2 ? 'rgba(244, 63, 94, 0.3)' :
                                                  'rgba(250, 204, 21, 0.2)'}`,
                            }}>
                              <div className="text-xs font-medium" style={{ color: '#94a3b8' }}>{hole.hole_number}</div>
                              {hasCourseData && hole.par != null && (
                                <div className="text-xs" style={{ color: '#64748b' }}>
                                  P{hole.par}{hole.yardage ? ` ${hole.yardage}y` : ''}
                                </div>
                              )}
                              <div className="text-xs font-bold" style={{ color: getResultColor(hole.winner_team) }}>
                                {hole.winner_team === 1 ? 'T1' : hole.winner_team === 2 ? 'T2' : '-'}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                      return (
                        <>
                          <div className="mb-2">{renderHoleGrid(expandedRoundData.hole_results.slice(0, 9))}</div>
                          {renderHoleGrid(expandedRoundData.hole_results.slice(9, 18))}
                        </>
                      );
                    })()}
                    <div className="mt-3 flex justify-center gap-4 text-xs" style={{ color: '#94a3b8' }}>
                      <span><span style={{ color: '#60a5fa' }}>T1</span> = Team 1 win</span>
                      <span><span style={{ color: '#f43f5e' }}>T2</span> = Team 2 win</span>
                      <span><span style={{ color: '#facc15' }}>-</span> = Halved</span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GolfHistory;
