import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const QuizResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, skill } = location.state || {};

  if (!result || !skill) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No results found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getEmoji = (score) => {
    if (score >= 80) return '🎉';
    if (score >= 60) return '👍';
    return '📚';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-8 text-center">
          <div className="text-6xl mb-4">{getEmoji(result.score)}</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
          <p className="text-xl text-gray-600 mb-6">Your {skill.name} Score</p>

          <div className={`text-6xl font-bold mb-4 ${getScoreColor(result.score)}`}>
            {result.score}%
          </div>

          <div className="max-w-md mx-auto mb-6">
            <div className="bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-1000 ${getScoreColor(result.score)}`}
                style={{ width: `${result.score}%`, backgroundColor: result.score >= 80 ? '#10B981' : result.score >= 60 ? '#F59E0B' : '#EF4444' }}
              ></div>
            </div>
          </div>

          <p className="text-gray-600 mb-8">
            You answered {result.correct_answers} out of {result.total_questions} questions correctly
          </p>

          <div className="space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate(`/quiz/${skill.id}`)}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition duration-200"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;