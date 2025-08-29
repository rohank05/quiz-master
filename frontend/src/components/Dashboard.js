import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Trophy, Target, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const [skills, setSkills] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [skillsResponse, performanceResponse] = await Promise.all([
        axios.get('/api/questions/skills'),
        axios.get('/api/reports/user-performance')
      ]);

      setSkills(skillsResponse.data);
      setPerformance(performanceResponse.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (skillId) => {
    navigate(`/quiz/${skillId}`);
  };

  if (loading) {
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
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.username}!
          </h1>
          <p className="mt-2 text-gray-600">Ready to test your skills?</p>
        </div>

        {/* Take Quiz Section */}
        <div className="bg-white overflow-hidden shadow-lg rounded-xl mb-8">
          <div className="px-6 py-4 bg-blue-600">
            <h3 className="text-lg font-medium text-white">Take a Quiz</h3>
          </div>
          <div className="p-6">
            <p className="text-gray-600 mb-4">Select a skill to start your quiz:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {skills.map(skill => (
                <button
                  key={skill.id}
                  onClick={() => startQuiz(skill.id)}
                  className="text-left p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition duration-200 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 group-hover:text-blue-600">
                      {skill.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {skill.question_count} questions
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {performance && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-3xl font-bold text-blue-600">
                {performance.overall.total_quizzes}
              </div>
              <div className="text-gray-600 mt-1">Quizzes Taken</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-3xl font-bold text-green-600">
                {performance.overall.average_score}%
              </div>
              <div className="text-gray-600 mt-1">Average Score</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
              <div className="text-3xl font-bold text-purple-600">
                {performance.skills.length}
              </div>
              <div className="text-gray-600 mt-1">Skills Practiced</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;