import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Player, GolfRound, GolfRoundUpdate, GolfHoleInput, GolfCourseSearchResult, GolfCourseOut, GolfCourseTee } from '../types';
import { golfAPI } from '../services/api';

interface EditGolfRoundProps {
  roundId: number;
  players: Player[];
  onRoundUpdated: (round: GolfRound) => void;
  onRoundDeleted: () => void;
  onCancel: () => void;
}

const EditGolfRound: React.FC<EditGolfRoundProps> = ({ roundId, players, onRoundUpdated, onRoundDeleted, onCancel }) => {
  const [round, setRound] = useState<GolfRound | null>(null);
  const [loading, setLoading] = useState(true);

  const [team1Player1, setTeam1Player1] = useState<number | null>(null);
  const [team1Player2, setTeam1Player2] = useState<number | null>(null);
  const [team2Player1, setTeam2Player1] = useState<number | null>(null);
  const [team2Player2, setTeam2Player2] = useState<number | null>(null);
  const [course, setCourse] = useState('');
  const [holeResults, setHoleResults] = useState<(number | null)[]>(Array(18).fill(null));
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Course search state
  const [courseQuery, setCourseQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GolfCourseSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<GolfCourseOut | null>(null);
  const [selectedTee, setSelectedTee] = useState<GolfCourseTee | null>(null);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [useManualCourse, setUseManualCourse] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced course search
  const handleCourseSearch = useCallback((query: string) => {
    setCourseQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (query.length < 2) { setSearchResults([]); setShowDropdown(false); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await golfAPI.searchCourses(query);
        setSearchResults(results);
        setShowDropdown(true);
      } catch { setSearchResults([]); }
      finally { setIsSearching(false); }
    }, 400);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCourse = async (result: GolfCourseSearchResult) => {
    setShowDropdown(false);
    setCourseQuery(`${result.club_name} - ${result.course_name}`);
    setIsLoadingCourse(true);
    try {
      const fullCourse = await golfAPI.getCourse(result.id);
      setSelectedCourse(fullCourse);
      setSelectedTee(null);
      setCourse(`${fullCourse.club_name} - ${fullCourse.course_name}`);
    } catch { setError('Failed to load course data.'); setSelectedCourse(null); }
    finally { setIsLoadingCourse(false); }
  };

  const handleSelectTee = (teeId: number) => {
    if (!selectedCourse) return;
    setSelectedTee(selectedCourse.tees.find(t => t.id === teeId) || null);
  };

  const handleClearCourse = () => {
    setSelectedCourse(null); setSelectedTee(null); setCourseQuery(''); setCourse(''); setUseManualCourse(false);
  };

  useEffect(() => {
    const loadRound = async () => {
      try {
        setLoading(true);
        const data = await golfAPI.getRound(roundId);
        setRound(data);
        setCourse(data.course);

        if (data.team1_players.length >= 2) {
          setTeam1Player1(data.team1_players[0].id);
          setTeam1Player2(data.team1_players[1].id);
        }
        if (data.team2_players.length >= 2) {
          setTeam2Player1(data.team2_players[0].id);
          setTeam2Player2(data.team2_players[1].id);
        }

        const holes = Array(18).fill(null);
        data.hole_results.forEach(h => { holes[h.hole_number - 1] = h.winner_team; });
        setHoleResults(holes);

        // Pre-populate course selection if linked
        if (data.golf_course) {
          setSelectedCourse(data.golf_course);
          setCourseQuery(`${data.golf_course.club_name} - ${data.golf_course.course_name}`);
          if (data.tee_id) {
            const tee = data.golf_course.tees.find(t => t.id === data.tee_id);
            if (tee) setSelectedTee(tee);
          }
        } else {
          setUseManualCourse(true);
        }
      } catch {
        setError('Failed to load round data');
      } finally {
        setLoading(false);
      }
    };
    loadRound();
  }, [roundId]);

  const getSelectedPlayers = () => [team1Player1, team1Player2, team2Player1, team2Player2].filter(id => id !== null) as number[];
  const getAvailablePlayersFor = (currentSelection: number | null) => {
    const sel = getSelectedPlayers();
    return players.filter(p => !sel.includes(p.id) || p.id === currentSelection);
  };

  const setHoleResult = (holeIndex: number, winnerTeam: number | null) => {
    setHoleResults(prev => { const next = [...prev]; next[holeIndex] = prev[holeIndex] === winnerTeam ? null : winnerTeam; return next; });
  };

  const team1HolesWon = holeResults.filter(r => r === 1).length;
  const team2HolesWon = holeResults.filter(r => r === 2).length;
  const halvedHoles = holeResults.filter(r => r === null).length;

  const team1PlayersSelected = [team1Player1, team1Player2].filter(id => id !== null) as number[];
  const team2PlayersSelected = [team2Player1, team2Player2].filter(id => id !== null) as number[];
  const hasCourse = (selectedCourse !== null) || (useManualCourse && course.trim() !== '');
  const canUpdate = team1PlayersSelected.length === 2 && team2PlayersSelected.length === 2 && hasCourse && !isUpdating;

  const getHoleInfo = (holeNumber: number) => {
    if (!selectedTee) return null;
    return selectedTee.holes.find(h => h.hole_number === holeNumber) || null;
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      setError(null);

      const holes: GolfHoleInput[] = holeResults.map((winner, idx) => {
        const holeInfo = getHoleInfo(idx + 1);
        return { hole_number: idx + 1, winner_team: winner, par: holeInfo?.par, yardage: holeInfo?.yardage };
      });

      const updateData: GolfRoundUpdate = {
        team1_players: team1PlayersSelected,
        team2_players: team2PlayersSelected,
        course: course.trim() || undefined,
        course_id: selectedCourse?.id,
        tee_id: selectedTee?.id,
        holes,
      };

      const updatedRound = await golfAPI.updateRound(roundId, updateData);
      onRoundUpdated(updatedRound);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update round');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      await golfAPI.deleteRound(roundId);
      onRoundDeleted();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete round');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const selectStyle: React.CSSProperties = {
    display: 'block', width: '100%', borderRadius: '0.375rem',
    border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f1f5f9', padding: '0.5rem 1rem',
  };

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', borderRadius: '0.375rem',
    border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f1f5f9', padding: '0.5rem 1rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#cbd5e1', marginBottom: '0.5rem',
  };

  if (loading) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <div className="text-center" style={{ color: '#94a3b8' }}>Loading round data...</div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <div className="text-center" style={{ color: '#f87171' }}>Failed to load round data</div>
        <div className="text-center mt-4">
          <button onClick={onCancel} style={{ backgroundColor: '#334155', color: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none' }}>
            Back to Rounds
          </button>
        </div>
      </div>
    );
  }

  const front9Par = selectedTee ? selectedTee.holes.filter(h => h.hole_number <= 9).reduce((s, h) => s + h.par, 0) : null;
  const back9Par = selectedTee ? selectedTee.holes.filter(h => h.hole_number > 9).reduce((s, h) => s + h.par, 0) : null;
  const front9Yards = selectedTee ? selectedTee.holes.filter(h => h.hole_number <= 9).reduce((s, h) => s + h.yardage, 0) : null;
  const back9Yards = selectedTee ? selectedTee.holes.filter(h => h.hole_number > 9).reduce((s, h) => s + h.yardage, 0) : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium" style={{ color: '#f1f5f9' }}>Edit Golf Round #{round.id}</h2>
          <button onClick={onCancel} style={{ color: '#94a3b8', backgroundColor: 'transparent', border: 'none' }}>
            X Cancel
          </button>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Course Search */}
          <div>
            <label style={labelStyle}>Course</label>
            {!selectedCourse && !useManualCourse ? (
              <div style={{ position: 'relative' }} ref={dropdownRef}>
                <input
                  type="text"
                  value={courseQuery}
                  onChange={(e) => handleCourseSearch(e.target.value)}
                  placeholder="Search for a golf course..."
                  style={inputStyle}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                />
                {isSearching && (
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.75rem' }}>
                    Searching...
                  </div>
                )}
                {showDropdown && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.375rem',
                    maxHeight: '240px', overflowY: 'auto', marginTop: '4px',
                  }}>
                    {searchResults.map(r => (
                      <div key={r.id} onClick={() => handleSelectCourse(r)}
                        style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid #1e293b' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1e293b')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ color: '#f1f5f9', fontSize: '0.875rem', fontWeight: 500 }}>{r.club_name}</div>
                        <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                          {r.course_name}{r.city ? ` - ${r.city}` : ''}{r.state ? `, ${r.state}` : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => { setUseManualCourse(true); setCourse(courseQuery); }}
                  style={{ marginTop: '0.5rem', color: '#94a3b8', backgroundColor: 'transparent', border: 'none', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  Enter course name manually instead
                </button>
              </div>
            ) : useManualCourse ? (
              <div>
                <input type="text" value={course} onChange={(e) => setCourse(e.target.value)} style={inputStyle} required />
                <button type="button" onClick={() => { setUseManualCourse(false); setCourse(''); }}
                  style={{ marginTop: '0.5rem', color: '#94a3b8', backgroundColor: 'transparent', border: 'none', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline' }}>
                  Search for a course instead
                </button>
              </div>
            ) : (
              <div className="rounded-lg p-3" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                {isLoadingCourse ? (
                  <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Loading course data...</div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div style={{ color: '#f1f5f9', fontWeight: 500 }}>{selectedCourse?.club_name}</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        {selectedCourse?.course_name}
                        {selectedCourse?.city ? ` - ${selectedCourse.city}` : ''}
                        {selectedCourse?.state ? `, ${selectedCourse.state}` : ''}
                      </div>
                    </div>
                    <button type="button" onClick={handleClearCourse}
                      style={{ color: '#f43f5e', backgroundColor: 'transparent', border: '1px solid rgba(244, 63, 94, 0.4)', padding: '0.25rem 0.5rem', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                      Change
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tee Selector */}
          {selectedCourse && selectedCourse.tees.length > 0 && (
            <div>
              <label style={labelStyle}>Tee Set</label>
              <select value={selectedTee?.id || ''} onChange={(e) => handleSelectTee(parseInt(e.target.value))} style={selectStyle}>
                <option value="">Select tees...</option>
                {selectedCourse.tees.map(tee => (
                  <option key={tee.id} value={tee.id}>
                    {tee.tee_name} ({tee.gender}) - {tee.total_yards ? `${tee.total_yards.toLocaleString()} yds` : 'N/A'} - Par {tee.par_total || 'N/A'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Team Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Team 1 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#60a5fa' }}>Team 1</h3>
              {[
                { value: team1Player1, setter: setTeam1Player1, label: 'Player 1' },
                { value: team1Player2, setter: setTeam1Player2, label: 'Player 2' },
              ].map(({ value, setter, label }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <select value={value || ''} onChange={(e) => setter(e.target.value ? parseInt(e.target.value) : null)} style={selectStyle}>
                    <option value="">Select a player...</option>
                    {getAvailablePlayersFor(value).map(player => (
                      <option key={player.id} value={player.id}>{player.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Team 2 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#f43f5e' }}>Team 2</h3>
              {[
                { value: team2Player1, setter: setTeam2Player1, label: 'Player 1' },
                { value: team2Player2, setter: setTeam2Player2, label: 'Player 2' },
              ].map(({ value, setter, label }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <select value={value || ''} onChange={(e) => setter(e.target.value ? parseInt(e.target.value) : null)} style={selectStyle}>
                    <option value="">Select a player...</option>
                    {getAvailablePlayersFor(value).map(player => (
                      <option key={player.id} value={player.id}>{player.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Hole-by-Hole Scorecard */}
          <div>
            <h3 className="text-lg font-medium mb-4" style={{ color: '#f1f5f9' }}>Hole-by-Hole Results</h3>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #334155' }}>
              {/* Front 9 */}
              <div className="px-4 py-2 flex justify-between items-center" style={{ backgroundColor: '#334155' }}>
                <span className="text-sm font-medium" style={{ color: '#f1f5f9' }}>Front 9</span>
                {selectedTee && (
                  <span className="text-xs" style={{ color: '#94a3b8' }}>Par {front9Par} | {front9Yards?.toLocaleString()} yds</span>
                )}
              </div>
              {Array.from({ length: 9 }, (_, i) => i).map(i => {
                const holeInfo = getHoleInfo(i + 1);
                return (
                  <div key={i} className="flex items-center px-4 py-2" style={{
                    backgroundColor: i % 2 === 0 ? '#1e293b' : '#162032',
                    borderBottom: i < 8 ? '1px solid #334155' : 'none',
                  }}>
                    <div className="w-24 flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: '#cbd5e1' }}>Hole {i + 1}</span>
                      {holeInfo && <span className="text-xs" style={{ color: '#64748b' }}>P{holeInfo.par} | {holeInfo.yardage}y</span>}
                    </div>
                    <div className="flex gap-2 flex-1 justify-center">
                      <button type="button" onClick={() => setHoleResult(i, 1)} style={{
                        padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600,
                        border: holeResults[i] === 1 ? '2px solid #60a5fa' : '1px solid #334155',
                        backgroundColor: holeResults[i] === 1 ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                        color: holeResults[i] === 1 ? '#60a5fa' : '#94a3b8',
                      }}>T1</button>
                      <button type="button" onClick={() => setHoleResult(i, 2)} style={{
                        padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600,
                        border: holeResults[i] === 2 ? '2px solid #f43f5e' : '1px solid #334155',
                        backgroundColor: holeResults[i] === 2 ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                        color: holeResults[i] === 2 ? '#f43f5e' : '#94a3b8',
                      }}>T2</button>
                    </div>
                    <span className="w-16 text-right text-xs" style={{
                      color: holeResults[i] === 1 ? '#60a5fa' : holeResults[i] === 2 ? '#f43f5e' : '#facc15',
                    }}>
                      {holeResults[i] === 1 ? 'Team 1' : holeResults[i] === 2 ? 'Team 2' : 'Halved'}
                    </span>
                  </div>
                );
              })}

              {/* Back 9 */}
              <div className="px-4 py-2 flex justify-between items-center" style={{ backgroundColor: '#334155' }}>
                <span className="text-sm font-medium" style={{ color: '#f1f5f9' }}>Back 9</span>
                {selectedTee && (
                  <span className="text-xs" style={{ color: '#94a3b8' }}>Par {back9Par} | {back9Yards?.toLocaleString()} yds</span>
                )}
              </div>
              {Array.from({ length: 9 }, (_, i) => i + 9).map(i => {
                const holeInfo = getHoleInfo(i + 1);
                return (
                  <div key={i} className="flex items-center px-4 py-2" style={{
                    backgroundColor: i % 2 === 0 ? '#1e293b' : '#162032',
                    borderBottom: i < 17 ? '1px solid #334155' : 'none',
                  }}>
                    <div className="w-24 flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: '#cbd5e1' }}>Hole {i + 1}</span>
                      {holeInfo && <span className="text-xs" style={{ color: '#64748b' }}>P{holeInfo.par} | {holeInfo.yardage}y</span>}
                    </div>
                    <div className="flex gap-2 flex-1 justify-center">
                      <button type="button" onClick={() => setHoleResult(i, 1)} style={{
                        padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600,
                        border: holeResults[i] === 1 ? '2px solid #60a5fa' : '1px solid #334155',
                        backgroundColor: holeResults[i] === 1 ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                        color: holeResults[i] === 1 ? '#60a5fa' : '#94a3b8',
                      }}>T1</button>
                      <button type="button" onClick={() => setHoleResult(i, 2)} style={{
                        padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: 600,
                        border: holeResults[i] === 2 ? '2px solid #f43f5e' : '1px solid #334155',
                        backgroundColor: holeResults[i] === 2 ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                        color: holeResults[i] === 2 ? '#f43f5e' : '#94a3b8',
                      }}>T2</button>
                    </div>
                    <span className="w-16 text-right text-xs" style={{
                      color: holeResults[i] === 1 ? '#60a5fa' : holeResults[i] === 2 ? '#f43f5e' : '#facc15',
                    }}>
                      {holeResults[i] === 1 ? 'Team 1' : holeResults[i] === 2 ? 'Team 2' : 'Halved'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
            <div className="text-sm" style={{ color: '#fde047' }}>
              <strong>Summary:</strong>{' '}
              <span style={{ color: '#60a5fa' }}>Team 1: {team1HolesWon}</span>
              {' - '}
              <span style={{ color: '#f43f5e' }}>Team 2: {team2HolesWon}</span>
              {' - '}
              <span style={{ color: '#facc15' }}>Halved: {halvedHoles}</span>
              <span className="ml-4">
                {team1HolesWon > team2HolesWon ? 'Team 1 Wins!' : team2HolesWon > team1HolesWon ? 'Team 2 Wins!' : 'Draw!'}
              </span>
            </div>
          </div>

          {error && (
            <div className="text-sm rounded-lg p-3" style={{ color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex gap-4">
              <button type="submit" disabled={!canUpdate} style={{
                flex: 1, backgroundColor: '#f43f5e', color: '#f8fafc', padding: '0.75rem 1rem',
                borderRadius: '0.375rem', fontWeight: 600, border: 'none',
                opacity: canUpdate ? 1 : 0.5, cursor: canUpdate ? 'pointer' : 'not-allowed',
              }}>
                {isUpdating ? 'Updating Round...' : 'Update Round'}
              </button>
              <button type="button" onClick={onCancel} style={{
                padding: '0.75rem 1.5rem', border: '1px solid #334155', borderRadius: '0.375rem',
                color: '#cbd5e1', backgroundColor: 'transparent',
              }}>
                Cancel
              </button>
            </div>

            {/* Delete Button */}
            <div className="pt-4" style={{ borderTop: '1px solid #334155' }}>
              {!showDeleteConfirm ? (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} style={{
                  width: '100%', backgroundColor: '#dc2626', color: '#f8fafc', padding: '0.75rem 1rem',
                  borderRadius: '0.375rem', fontWeight: 600, border: 'none',
                }}>
                  Delete Round
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="text-center rounded-lg p-3" style={{ color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    <p className="font-medium">Are you sure you want to delete this round?</p>
                    <p className="text-sm mt-1">This action cannot be undone and will update all player statistics.</p>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={handleDelete} disabled={isDeleting} style={{
                      flex: 1, backgroundColor: '#dc2626', color: '#f8fafc', padding: '0.5rem 1rem',
                      borderRadius: '0.375rem', fontWeight: 600, border: 'none',
                      opacity: isDeleting ? 0.5 : 1, cursor: isDeleting ? 'not-allowed' : 'pointer',
                    }}>
                      {isDeleting ? 'Deleting...' : 'Yes, Delete Round'}
                    </button>
                    <button type="button" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} style={{
                      flex: 1, backgroundColor: '#334155', color: '#f1f5f9', padding: '0.5rem 1rem',
                      borderRadius: '0.375rem', fontWeight: 600, border: 'none', opacity: isDeleting ? 0.5 : 1,
                    }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGolfRound;
