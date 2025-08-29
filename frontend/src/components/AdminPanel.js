import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, FileText, BarChart3, UserPlus, Edit, Trash2 } from 'lucide-react';

const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    skill_id: '',
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: '',
    difficulty: 'Medium'
  });
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'questions') {
      fetchQuestions();
      fetchSkills();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/reports/admin-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/reports/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await axios.get('/api/questions');
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchSkills = async () => {
    try {
      const response = await axios.get('/api/questions/skills');
      setSkills(response.data);
    } catch (error) {
      console.error('Error fetching skills:', error);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/questions', newQuestion);
      setShowAddQuestion(false);
      setNewQuestion({
        skill_id: '',
        question_text: '',
        option_a: '',
        option_b: '',
        option_c: '',
        option_d: '',
        correct_option: '',
        difficulty: 'Medium'
      });
      fetchQuestions(); // Refresh the list
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Failed to add question');
    }
  };

  const toggleUserRole = async (userId) => {
    try {
      await axios.put(`/api/users/${userId}/role`, { role: 'admin' });
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const deleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      await axios.delete(`/api/questions/${questionId}`);
      fetchQuestions(); // Refresh the list
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question');
    }
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="mt-2 text-gray-600">Manage users, questions, and view reports</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Users
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`px-4 py-2 rounded-lg font-medium ${
                activeTab === 'questions'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Questions
            </button>
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <Users className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                <div className="text-3xl font-bold text-blue-600">{stats.users.total_users}</div>
                <div className="text-gray-600 mt-1">Total Users</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <FileText className="mx-auto h-8 w-8 text-green-600 mb-2" />
                <div className="text-3xl font-bold text-green-600">{stats.questions.total_questions}</div>
                <div className="text-gray-600 mt-1">Questions</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <BarChart3 className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                <div className="text-3xl font-bold text-purple-600">{stats.quizzes.total_attempts}</div>
                <div className="text-gray-600 mt-1">Quiz Attempts</div>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <UserPlus className="mx-auto h-8 w-8 text-orange-600 mb-2" />
                <div className="text-3xl font-bold text-orange-600">{stats.questions.total_skills}</div>
                <div className="text-gray-600 mt-1">Skills</div>
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-white shadow-lg rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-green-600">
                <h3 className="text-lg font-medium text-white">Analytics & Reports</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Score Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded"></div>
                          <span className="text-xs text-gray-600">Excellent (80%+)</span>
                        </div>
                        <span className="text-sm font-medium">
                          {stats.recent_activity.filter(a => a.score >= 80).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                          <span className="text-xs text-gray-600">Good (60-79%)</span>
                        </div>
                        <span className="text-sm font-medium">
                          {stats.recent_activity.filter(a => a.score >= 60 && a.score < 80).length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded"></div>
                          <span className="text-xs text-gray-600">Needs Work (&lt;60%)</span>
                        </div>
                        <span className="text-sm font-medium">
                          {stats.recent_activity.filter(a => a.score < 60).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Quiz Activity</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {stats.recent_activity.slice(0, 5).map((activity, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                              {activity.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{activity.username}</div>
                              <div className="text-xs text-gray-500">{activity.skill_name} • {new Date(activity.completed_at).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <div className={`text-lg font-bold ${
                            activity.score >= 80 ? 'text-green-600' :
                            activity.score >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {activity.score}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-indigo-600 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">User Management</h3>
              <span className="text-indigo-100 text-sm">{users.length} users</span>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {users.map(user => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                        {user.role !== 'admin' && (
                          <button
                            onClick={() => toggleUserRole(user.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Make Admin
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">{user.quizzes_taken}</div>
                        <div className="text-xs text-gray-500">Quizzes</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{user.average_score || 0}%</div>
                        <div className="text-xs text-gray-500">Avg Score</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-purple-600 flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Question Management</h3>
               <button
                 onClick={() => setShowAddQuestion(true)}
                 className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition duration-200 text-sm font-medium"
               >
                 Add Question
               </button>
            </div>
            <div className="p-6">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {questions.map(question => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {question.skill_name}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                            {question.difficulty}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 mb-2 text-sm">{question.question_text}</p>
                        <div className="text-xs text-gray-600">
                          {['A', 'B', 'C', 'D'].map(option => (
                            <div key={option} className={option === question.correct_option ? 'text-green-600 font-medium' : ''}>
                              {option}. {question[`option_${option.toLowerCase()}`]}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Question Modal */}
        {showAddQuestion && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add New Question</h3>
                <button
                  onClick={() => setShowAddQuestion(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skill</label>
                  <select
                    value={newQuestion.skill_id}
                    onChange={(e) => setNewQuestion({...newQuestion, skill_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a skill</option>
                    {skills.map(skill => (
                      <option key={skill.id} value={skill.id}>{skill.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
                  <textarea
                    value={newQuestion.question_text}
                    onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option A</label>
                    <input
                      type="text"
                      value={newQuestion.option_a}
                      onChange={(e) => setNewQuestion({...newQuestion, option_a: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option B</label>
                    <input
                      type="text"
                      value={newQuestion.option_b}
                      onChange={(e) => setNewQuestion({...newQuestion, option_b: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option C</label>
                    <input
                      type="text"
                      value={newQuestion.option_c}
                      onChange={(e) => setNewQuestion({...newQuestion, option_c: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Option D</label>
                    <input
                      type="text"
                      value={newQuestion.option_d}
                      onChange={(e) => setNewQuestion({...newQuestion, option_d: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correct Option</label>
                    <select
                      value={newQuestion.correct_option}
                      onChange={(e) => setNewQuestion({...newQuestion, correct_option: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select correct option</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      value={newQuestion.difficulty}
                      onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddQuestion(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
                  >
                    Add Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;