import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Quiz = () => {
  const { skillId } = useParams();
  const navigate = useNavigate();
  const [quizData, setQuizData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);

  useEffect(() => {
    fetchQuiz();
    setStartTime(Date.now());
  }, [skillId]);

  const fetchQuiz = async () => {
    try {
      const response = await axios.get(`/api/quizzes/start/${skillId}`);
      setQuizData(response.data);
      // Initialize selected answer for the first question
      setSelectedAnswer('');
    } catch (error) {
      console.error('Error fetching quiz:', error);
      alert('Failed to load quiz. Please try again.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    setAnswers({
      ...answers,
      [currentQuestion]: answer
    });
  };

  const nextQuestion = () => {
    if (currentQuestion < quizData.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1] || '');
    } else {
      submitQuiz();
    }
  };

  const previousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || '');
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);

    try {
      const timeTaken = Math.floor((Date.now() - startTime) / 1000);

      const quizAnswers = quizData.questions.map((question, index) => ({
        question_id: question.id,
        selected_option: answers[index] || ''
      }));

      const response = await axios.post('/api/quizzes/submit', {
        skill_id: skillId,
        answers: quizAnswers,
        time_taken_seconds: timeTaken
      });

      // Navigate to results
      navigate('/quiz-results', {
        state: {
          result: response.data,
          skill: quizData.skill
        }
      });

    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quizData || !quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {!quizData ? 'Quiz not found' : 'No questions available'}
          </h2>
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

  // Ensure currentQuestion is within bounds
  const validCurrentQuestion = Math.min(currentQuestion, quizData.questions.length - 1);
  const question = quizData.questions[validCurrentQuestion];
  const progress = ((validCurrentQuestion + 1) / quizData.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="px-6 py-4 bg-blue-600 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">{quizData.skill.name} Quiz</h2>
            <span className="text-blue-100">
              Question {validCurrentQuestion + 1} of {quizData.questions.length}
            </span>
          </div>
          <div className="mt-2 bg-blue-500 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="p-8">
           <h3 className="text-xl font-medium text-gray-900 mb-6">
             {question.question_text}
           </h3>

          <div className="space-y-3">
            {['A', 'B', 'C', 'D'].map((option, index) => (
              <button
                key={option}
                onClick={() => handleAnswerSelect(option)}
                className={`w-full text-left p-4 border-2 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition duration-200 ${
                  selectedAnswer === option
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <span className="font-medium">{option}.</span> {question[`option_${option.toLowerCase()}`]}
              </button>
            ))}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={previousQuestion}
              disabled={currentQuestion === 0}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <button
              onClick={nextQuestion}
              disabled={!selectedAnswer || submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Submitting...'
                : validCurrentQuestion === quizData.questions.length - 1
                ? 'Finish Quiz'
                : 'Next'
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quiz;