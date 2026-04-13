import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Printer, LogOut, Save } from 'lucide-react';
import { translations } from '../translations';

export interface Question {
  topic: string;
  question: string;
  correct: string;
  options: Record<string, string>;
}

interface QuizProps {
  questions: Question[];
  onExit: () => void;
  hideCorrectAnswer?: boolean;
  onFinish?: (score: number) => void;
  onRestart?: () => void;
  onSave?: (questions: Question[]) => void;
  t: typeof translations.pt;
}

/**
 * The Core Quiz Engine.
 * Manages the interactive session, including the question timer, option selection feedback,
 * keyboard navigation (A-H, Enter), and the final results summary with topic performance breakdown.
 */
export default function Quiz({ questions, onExit, hideCorrectAnswer = false, onFinish, onRestart, onSave, t }: QuizProps) {
  // --- Shuffling Logic ---

  const shuffleQuestionsAndOptions = (qs: Question[]) => {
    return qs.map(q => {
      const optionsArray = Object.keys(q.options).map(k => ({ originalKey: k, value: q.options[k] }));
      const shuffledArray = optionsArray.sort(() => Math.random() - 0.5);
      
      const newOptions: Record<string, string> = {};
      let newCorrect = '';
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      
      shuffledArray.forEach((item, index) => {
        const newKey = alphabet[index];
        newOptions[newKey] = item.value;
        if (item.originalKey === q.correct) {
          newCorrect = newKey;
        }
      });

      return {
        ...q,
        correct: newCorrect,
        options: newOptions
      };
    }).sort(() => Math.random() - 0.5);
  };

  const [localQuestions, setLocalQuestions] = useState<Question[]>(questions);

  useEffect(() => {
    setLocalQuestions(questions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setShowFeedback(false);
    setQuizFinished(false);
    setUserAnswers({});
    setTimeElapsed(0); 
  }, [questions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  const [timeElapsed, setTimeElapsed] = useState(0);
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!quizFinished) {
      timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [quizFinished]);

  const handlePlayAgain = useCallback(() => {
    if (onRestart) {
      onRestart();
    }
  }, [onRestart]);

  const currentQuestion = localQuestions[currentIndex];
  const optionKeys = useMemo(() => currentQuestion ? Object.keys(currentQuestion.options).sort() : [], [currentQuestion]);

  const handleOptionSelect = useCallback((optionKey: string) => {
    if (showFeedback) return;
    
    setSelectedOption(optionKey);
    setShowFeedback(true);
    setUserAnswers(prev => ({ ...prev, [currentIndex]: optionKey }));
    
    if (optionKey === currentQuestion.correct.toLowerCase()) {
      setScore((prev) => prev + 1);
    }
  }, [showFeedback, currentQuestion, currentIndex]);

  const handleNextQuestion = useCallback(() => {
    if (currentIndex < localQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setShowFeedback(false);
    } else {
      setQuizFinished(true);
      if (onFinish) onFinish(score);
    }
  }, [currentIndex, localQuestions.length, onFinish, score]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (quizFinished) return;
      
      if (showFeedback && e.key === 'Enter') {
        handleNextQuestion();
        return;
      }

      if (!showFeedback) {
        const key = e.key.toLowerCase();
        if (optionKeys.includes(key)) {
          handleOptionSelect(key);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFeedback, quizFinished, optionKeys, handleOptionSelect, handleNextQuestion]);

  if (quizFinished) {
    const percentage = Math.round((score / localQuestions.length) * 100);

    const topicStats: Record<string, { total: number; correct: number }> = {};
    localQuestions.forEach((q, idx) => {
      const topic = q.topic;
      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, correct: 0 };
      }
      topicStats[topic].total += 1;
      if (userAnswers[idx] === q.correct.toLowerCase()) {
        topicStats[topic].correct += 1;
      }
    });
    
    const topics = Object.keys(topicStats).sort((a, b) => {
      const percentageA = topicStats[a].correct / topicStats[a].total;
      const percentageB = topicStats[b].correct / topicStats[b].total;
      if (percentageB !== percentageA) {
        return percentageB - percentageA; 
      }
      return a.localeCompare(b); 
    });
    const hasMultipleTopics = topics.length > 1;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full mx-auto print:max-w-none print:m-0 print:p-0"
      >
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 text-center mb-8 print:shadow-none print:border-none print:mb-4">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">{t.quizFinished}</h2>
          <div className="flex justify-center items-center mb-6">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 border-4 border-indigo-100 dark:border-indigo-900/50 print:border-indigo-500">
              <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{percentage}%</span>
            </div>
          </div>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            {t.youGot} <span className="font-bold text-slate-800 dark:text-white">{score}</span> {t.of} <span className="font-bold text-slate-800 dark:text-white">{questions.length}</span> {t.questionsLabel} {t.inLabel} <span className="font-bold text-slate-800 dark:text-white">{formatTime(timeElapsed)}</span>.
          </p>

          {hasMultipleTopics && (
            <div className="mb-8 text-left bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700 print:bg-transparent print:border-slate-300 print:break-inside-avoid">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 print:text-black">{t.topicPerformance}</h3>
              <div className="space-y-4">
                {topics.map(topic => {
                  const stat = topicStats[topic];
                  const topicPercentage = Math.round((stat.correct / stat.total) * 100);
                  return (
                    <div key={topic}>
                      <div className="flex justify-between text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <span>{topic}</span>
                        <span>{stat.correct} {t.of} {stat.total} ({topicPercentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 print:bg-slate-100">
                        <div 
                          className={`h-2 rounded-full print:border print:border-slate-400 ${topicPercentage >= 70 ? 'bg-emerald-500' : topicPercentage >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${topicPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 print:hidden">
            <button
              onClick={handlePlayAgain}
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors w-full sm:w-auto"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              {t.playAgain}
            </button>
            <button
              onClick={() => onSave?.(localQuestions)}
              className="inline-flex items-center justify-center px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors w-full sm:w-auto"
            >
              <Save className="w-5 h-5 mr-2" />
              {t.saveQuiz}
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto"
            >
              <Printer className="w-5 h-5 mr-2" />
              {t.printPdf}
            </button>
            <button
              onClick={onExit}
              className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 dark:bg-slate-800 text-white font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto"
            >
              <LogOut className="w-5 h-5 mr-2" />
              {t.exitQuiz}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-white px-2 print:text-black">{t.reviewAnswers}</h3>
          {questions.map((q, idx) => {
            const userAnswer = userAnswers[idx];
            const isCorrect = userAnswer === q.correct.toLowerCase();
            
            return (
              <div 
                key={idx} 
                className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-2 p-6 md:p-8 print:break-inside-avoid print:shadow-none ${
                  isCorrect ? 'border-emerald-200 dark:border-emerald-900/50 print:border-emerald-500' : 'border-red-200 dark:border-red-900/50 print:border-red-500'
                }`}
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 mt-1">
                    {isCorrect ? (
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-500" />
                    )}
                  </div>
                  <div>
                    <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider rounded-full mb-3">
                      {t.question} {idx + 1} • {q.topic}
                    </div>
                    <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {q.question}
                    </h4>
                  </div>
                </div>

                <div className="space-y-3 pl-12">
                  {Object.keys(q.options).sort().map((key) => {
                    const isOptionCorrect = key === q.correct.toLowerCase();
                    const isOptionSelected = key === userAnswer;
                    
                    // Lógica para omitir a resposta correta se o usuário errou
                    const shouldShowCorrect = isOptionCorrect && (!hideCorrectAnswer || isOptionSelected);
                    
                    let optionClass = "w-full text-left p-4 rounded-xl border-2 flex items-start gap-3 ";
                    
                    if (shouldShowCorrect) {
                      optionClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300";
                    } else if (isOptionSelected && !isOptionCorrect) {
                      optionClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300";
                    } else {
                      optionClass += "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 opacity-60";
                    }

                    return (
                      <div key={key} className={optionClass}>
                        <div className="flex-shrink-0 mt-0.5">
                          {shouldShowCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          ) : isOptionSelected && !isOptionCorrect ? (
                            <XCircle className="w-5 h-5 text-red-600" />
                          ) : (
                            <div className="w-6 h-6 rounded-md border-2 border-current flex items-center justify-center text-xs font-bold uppercase bg-white/50 dark:bg-black/20">
                              {key}
                            </div>
                          )}
                        </div>
                        <span className="text-base leading-relaxed">{q.options[key]}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl w-full mx-auto">
      <div className="mb-8">
        <div className="flex justify-between text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
          <span>{t.question} {currentIndex + 1} {t.of} {questions.length}</span>
          
          <div className="flex gap-4">
            <span className="font-mono bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
              ⏱ {formatTime(timeElapsed)}
            </span>
            <span>{Math.round(((currentIndex) / questions.length) * 100)}% {t.done}</span>
          </div>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8"
        >
          <div className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold uppercase tracking-wider rounded-full mb-4">
            {currentQuestion.topic}
          </div>
          
          <h3 className="text-xl md:text-2xl font-medium text-slate-800 dark:text-white mb-8 leading-relaxed">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {optionKeys.map((key) => {
              const isSelected = selectedOption === key;
              const isCorrect = currentQuestion.correct.toLowerCase() === key;
              
              // Lógica para omitir a resposta correta durante o quiz ativo
              const shouldShowCorrect = isCorrect && (!hideCorrectAnswer || isSelected);
              
              let buttonClass = "w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ";
              
              if (!showFeedback) {
                buttonClass += "border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-700 dark:text-slate-300";
              } else {
                if (shouldShowCorrect) {
                  buttonClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300";
                } else if (isSelected && !isCorrect) {
                  buttonClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300";
                } else {
                  buttonClass += "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 opacity-50";
                }
              }

              return (
                <button
                  key={key}
                  onClick={() => handleOptionSelect(key)}
                  disabled={showFeedback}
                  className={buttonClass}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {showFeedback && shouldShowCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : showFeedback && isSelected && !isCorrect ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <div className="w-6 h-6 rounded-md border-2 border-current flex items-center justify-center text-xs font-bold uppercase bg-white/50 dark:bg-black/20">
                        {key}
                      </div>
                    )}
                  </div>
                  <span className="text-base leading-relaxed">{currentQuestion.options[key]}</span>
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end"
            >
              <button
                onClick={handleNextQuestion}
                className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white font-medium rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-700 transition-colors"
              >
                <span>{currentIndex < questions.length - 1 ? t.nextQuestion : t.viewResults}</span>
                {currentIndex < questions.length - 1 ? (
                  <div className="ml-3 px-2 py-1 bg-slate-700 dark:bg-slate-800 rounded text-xs text-slate-300 dark:text-slate-400 font-mono flex items-center">
                    Enter ↵
                  </div>
                ) : (
                  <ArrowRight className="w-5 h-5 ml-2" />
                )}
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}