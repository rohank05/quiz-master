import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Target, Award, Calendar } from 'lucide-react';

const Performance = () => {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const response = await axios.get('/api/reports/user-performance');
      setPerformance(response.data);
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No performance data available</h2>
          <p className="text-gray-600">Take some quizzes to see your performance analytics!</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const chartData = performance.recent_activity.slice(-10).reverse().map((activity, index) => ({
    name: `Quiz ${index + 1}`,
    score: activity.score,
    skill: activity.skill_name
  }));

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="mt-2 text-gray-600">Detailed insights into your quiz performance</p>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-4xl font-bold text-blue-600">{performance.overall.total_quizzes}</div>
            <div className="text-gray-600 mt-1">Total Quizzes</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-4xl font-bold text-green-600">{performance.overall.average_score}%</div>
            <div className="text-gray-600 mt-1">Average Score</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-4xl font-bold text-purple-600">{performance.overall.best_score}%</div>
            <div className="text-gray-600 mt-1">Best Score</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-4xl font-bold text-orange-600">{performance.skills.length}</div>
            <div className="text-gray-600 mt-1">Skills Practiced</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Score Trend Chart */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-blue-600">
              <h3 className="text-lg font-medium text-white">Score Trend</h3>
            </div>
            <div className="p-6">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value}%`,
                        `Score (${props.payload.skill})`
                      ]}
                    />
                    <Bar dataKey="score" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-16">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 mt-4">No data to display</p>
                  <p className="text-sm text-gray-400">Take some quizzes to see your progress!</p>
                </div>
              )}
            </div>
          </div>

          {/* Skills Performance */}
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="px-6 py-4 bg-green-600">
              <h3 className="text-lg font-medium text-white">Skills Breakdown</h3>
            </div>
            <div className="p-6">
              {performance.skills.length > 0 ? (
                <div className="space-y-4">
                  {performance.skills.map(skill => (
                    <div key={skill.skill_name} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{skill.skill_name}</h4>
                        <span className="text-sm text-gray-500">{skill.quizzes_taken} quiz{skill.quizzes_taken !== 1 ? 'es' : ''}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{skill.average_score}%</div>
                          <div className="text-xs text-gray-500">Average</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{skill.best_score}%</div>
                          <div className="text-xs text-gray-500">Best</div>
                        </div>
                      </div>
                      <div className="bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${skill.average_score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Target className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-gray-500 mt-4">No skills data yet</p>
                  <p className="text-sm text-gray-400">Complete quizzes to see skill breakdown!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="px-6 py-4 bg-purple-600">
            <h3 className="text-lg font-medium text-white">Recent Activity</h3>
          </div>
          <div className="p-6">
            {performance.recent_activity.length > 0 ? (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {performance.recent_activity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition duration-200">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        activity.score >= 80 ? 'bg-green-100 text-green-600' :
                        activity.score >= 60 ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {activity.score >= 80 ? '🏆' : activity.score >= 60 ? '👍' : '📚'}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{activity.skill_name} Quiz</div>
                        <div className="text-sm text-gray-500">{activity.total_questions} questions • {new Date(activity.completed_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        activity.score >= 80 ? 'text-green-600' :
                        activity.score >= 60 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {activity.score}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {activity.score >= 80 ? 'Excellent' : activity.score >= 60 ? 'Good' : 'Needs Work'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <p className="text-gray-500 mt-4">No recent activity</p>
                <p className="text-sm text-gray-400">Your quiz history will appear here!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;