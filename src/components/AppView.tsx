/// <reference types="vite/client" />
import React from 'react';
import { Upload, PlayCircle, Download, Moon, Sun, Settings, X, Library, Trash2, Edit2, Check, Save, Languages } from 'lucide-react';
import Quiz, { Question } from './Quiz';
import { SavedQuiz } from '../App';
import { Language, translations } from '../translations';
import { QUINTASERIE_CSV, ENEM_CSV, ENAMED_CSV, OAB_CSV } from '../data/defaultCsv';

interface AppViewProps {
  // State
  isDarkMode: boolean;
  isStarted: boolean;
  isConfiguringQuestions: boolean;
  isQuizFinished: boolean;
  error: string | null;
  pendingQuestions: Question[] | null;
  topicCounts: Record<string, number>;
  topicLimits: Record<string, number>;
  isSavedQuizzesOpen: boolean;
  isSettingsOpen: boolean;
  savedQuizzes: SavedQuiz[];
  editingQuizId: string | null;
  editingName: string;
  enableCustomQuestionCount: boolean;
  hideCorrectAnswer: boolean;
  isExamplePopoverOpen: boolean;
  questions: Question[];
  language: Language;
  t: typeof translations.pt;
  setLanguage: (lang: Language) => void;
  
  // Actions
  toggleDarkMode: () => void;
  setIsSavedQuizzesOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setEnableCustomQuestionCount: (val: boolean) => void;
  setHideCorrectAnswer: (val: boolean) => void;
  setEditingQuizId: (id: string | null) => void;
  setEditingName: (name: string) => void;
  setPendingQuestions: (qs: Question[] | null) => void;
  setIsExamplePopoverOpen: (open: boolean) => void;
  
  // Handlers
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUploadAction: (action: 'save' | 'run' | 'both') => void;
  handleTopicLimitChange: (topic: string, val: number) => void;
  restartQuiz: () => void;
  startCustomQuiz: () => void;
  handleQuizRestart: () => void;
  handleSaveQuiz: (qs: Question[]) => void;
  handleQuizFinish: (score: number) => void;
  renameSavedQuiz: (id: string, name: string) => void;
  deleteSavedQuiz: (id: string) => void;
  loadSavedQuiz: (quiz: SavedQuiz) => void;
  loadExampleQuiz: (csv: string) => void;
  downloadTemplate: () => void;

  // Refs
  settingsButtonRef: React.RefObject<HTMLButtonElement | null>;
  settingsPopoverRef: React.RefObject<HTMLDivElement | null>;
  savedQuizzesButtonRef: React.RefObject<HTMLButtonElement | null>;
  savedQuizzesPopoverRef: React.RefObject<HTMLDivElement | null>;
  exampleButtonRef: React.RefObject<HTMLDivElement | null>;
  examplePopoverRef: React.RefObject<HTMLDivElement | null>;
}

export const AppView: React.FC<AppViewProps> = (props) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-200">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="Logo" className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{props.t.title}</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative flex items-center gap-2 sm:gap-4">
              <button
                onClick={props.toggleDarkMode}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title={props.isDarkMode ? "Light Mode" : "Dark Mode"}
              >
                {props.isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>            
              {((!props.isStarted && !props.isConfiguringQuestions) || props.isQuizFinished) && (
                <>
                  <button
                    ref={props.savedQuizzesButtonRef}
                    onClick={() => props.setIsSavedQuizzesOpen(!props.isSavedQuizzesOpen)}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={props.t.savedQuizzes}
                  >
                    <Library className="w-5 h-5" />
                  </button>
                  <button
                    ref={props.settingsButtonRef}
                    onClick={() => props.setIsSettingsOpen(!props.isSettingsOpen)}
                    className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={props.t.settings}
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </>
              )}

              {props.isSettingsOpen && (
                <div ref={props.settingsPopoverRef} className="absolute top-full left-12 mt-2 max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      {props.t.settings}
                    </h2>
                    <button onClick={() => props.setIsSettingsOpen(false)} className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="space-y-4">
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={props.enableCustomQuestionCount} onChange={(e) => props.setEnableCustomQuestionCount(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:checked:bg-indigo-500 transition-colors" />
                        <div>
                          <span className="text-base font-medium text-slate-900 dark:text-white block mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{props.t.setQuestionCount}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">{props.t.setQuestionCountDesc}</span>
                        </div>
                      </label>
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input type="checkbox" checked={props.hideCorrectAnswer} onChange={(e) => props.setHideCorrectAnswer(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:checked:bg-indigo-500 transition-colors" />
                        <div>
                          <span className="text-base font-medium text-slate-900 dark:text-white block mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{props.t.hideCorrect}</span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">{props.t.hideCorrectDesc}</span>
                        </div>
                      </label>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">{props.t.languageLabel}</span>
                        <div className="flex gap-2">
                          <button onClick={() => props.setLanguage('pt')} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${props.language === 'pt' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                            Português
                          </button>
                          <button onClick={() => props.setLanguage('en')} className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${props.language === 'en' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                            English
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end">
                    <button onClick={() => props.setIsSettingsOpen(false)} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm">{props.t.finish}</button>
                  </div>
                </div>
              )}

              {props.isSavedQuizzesOpen && (
                <div ref={props.savedQuizzesPopoverRef} className="absolute top-full left-12 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Library className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />{props.t.myQuizzes}</h2>
                    <button onClick={() => props.setIsSavedQuizzesOpen(false)} className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
                    {props.savedQuizzes.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center italic">{props.t.noQuizzes}</p>
                    ) : (
                      props.savedQuizzes.map(quiz => (
                        <div key={quiz.id} className="group flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                          {props.editingQuizId === quiz.id ? (
                            <div className="flex-1 flex items-center gap-2 px-1">
                              <input type="text" value={props.editingName} onChange={(e) => props.setEditingName(e.target.value)} className="flex-1 px-2 py-1 text-sm bg-white dark:bg-slate-900 border border-indigo-500 rounded-lg outline-none" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') props.renameSavedQuiz(quiz.id, props.editingName); if (e.key === 'Escape') props.setEditingQuizId(null); }} />
                              <button onClick={() => props.renameSavedQuiz(quiz.id, props.editingName)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"><Check className="w-4 h-4" /></button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => props.loadSavedQuiz(quiz)} className="flex-1 text-left min-w-0">
                                <p className="font-medium text-slate-900 dark:text-white truncate">{quiz.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{quiz.date} • {quiz.questions.length} {props.t.questionsLabel} {typeof quiz.highestScore === 'number' ? ` • ${props.t.record}: ${quiz.highestScore}%` : ''}</p>
                              </button>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                <button onClick={() => { props.setEditingQuizId(quiz.id); props.setEditingName(quiz.name); }} className="p-2 text-slate-400 hover:text-indigo-500 rounded-lg" title={props.t.rename}><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => props.deleteSavedQuiz(quiz.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg" title={props.t.delete}><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {(props.isStarted || props.isConfiguringQuestions) && (
              <button onClick={props.restartQuiz} className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors print:hidden">{props.t.exitQuiz}</button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {props.pendingQuestions && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{props.t.processed}</h3>
                <button onClick={() => props.setPendingQuestions(null)} className="p-1 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"><X className="w-6 h-6" /></button>
              </div>
              <div className="p-6">
                <p className="text-slate-600 dark:text-slate-400 mb-6">{props.t.whatToDo(props.pendingQuestions.length)}</p>
                <div className="grid gap-3">
                  <button onClick={() => props.handleUploadAction('run')} className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors"><PlayCircle className="w-5 h-5" />{props.t.justRun}</button>
                  <button onClick={() => props.handleUploadAction('both')} className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors"><Save className="w-5 h-5" />{props.t.saveAndRun}</button>
                  <button onClick={() => props.handleUploadAction('save')} className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><Library className="w-5 h-5" />{props.t.onlySave}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {props.error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium max-w-2xl mx-auto text-center">{props.error}</div>
        )}

        {props.isConfiguringQuestions ? (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{props.t.configTitle}</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">{props.t.configDesc}</p>
            <div className="space-y-4 mb-8">
              {Object.keys(props.topicCounts).map(topic => (
                <div key={topic} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">{topic}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{props.t.totalAvailable}: {props.topicCounts[topic]}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">{props.t.quantity}:</label>
                    <input type="number" min="0" max={props.topicCounts[topic]} value={props.topicLimits[topic]} onChange={(e) => props.handleTopicLimitChange(topic, parseInt(e.target.value))} className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-center font-medium" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
              <button onClick={props.restartQuiz} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto">{props.t.cancel}</button>
              <button onClick={props.startCustomQuiz} className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors w-full sm:w-auto">{props.t.startQuiz}</button>
            </div>
          </div>
        ) : !props.isStarted ? (
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-6">{props.t.mainTitle}</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">{props.t.mainDesc}</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="relative group rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[240px]">
                <input type="file" accept=".csv" onChange={props.handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Upload className="w-8 h-8" /></div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{props.t.uploadCsv}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">{props.t.uploadDesc}</p>
              </div>
              <div className="relative">
                <div ref={props.exampleButtonRef} onClick={() => props.setIsExamplePopoverOpen(!props.isExamplePopoverOpen)} className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[240px] w-full">
                  <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><PlayCircle className="w-8 h-8" /></div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{props.t.testExample}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center">{props.t.exampleDesc}</p>
                </div>
                {props.isExamplePopoverOpen && (
                  <div ref={props.examplePopoverRef} className="absolute top-full left-0 right-0 mt-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 space-y-1">
                      <button onClick={() => props.loadExampleQuiz(OAB_CSV)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="font-medium">Teste da OAB</span></button>
                      <button onClick={() => props.loadExampleQuiz(QUINTASERIE_CSV)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="font-medium">Teste da Quinta Série</span></button>
                      <button onClick={() => props.loadExampleQuiz(ENAMED_CSV)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-amber-500"></div><span className="font-medium">Teste do ENAMED</span></button>
                      <button onClick={() => props.loadExampleQuiz(ENEM_CSV)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="font-medium">Teste do ENEM</span></button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-12 text-left bg-slate-100 dark:bg-slate-800/50 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">{props.t.expectedFormat}</h4>
                <button onClick={props.downloadTemplate} className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"><Download className="w-4 h-4 mr-2" />{props.t.downloadTemplate}</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-slate-600 dark:text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-slate-700">
                      <th className="pb-2 font-medium text-left">{props.t.topic}</th>
                      <th className="pb-2 font-medium text-left">{props.t.question}</th>
                      <th className="pb-2 font-medium text-left">{props.t.correctAlt}</th>
                      <th className="pb-2 font-medium text-left">{props.t.altA}</th>
                      <th className="pb-2 font-medium text-left">{props.t.altB}</th>
                      <th className="pb-2 font-medium text-left">... (h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="pt-2">{props.language === 'pt' ? 'Matemática' : 'Math'}</td><td className="pt-2">Quanto é 2+2?</td><td className="pt-2">a</td><td className="pt-2">4</td><td className="pt-2">...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <Quiz 
            questions={props.questions} 
            onExit={props.restartQuiz} 
            hideCorrectAnswer={props.hideCorrectAnswer}
            onSave={props.handleSaveQuiz}
            onFinish={(score) => props.handleQuizFinish(score)} 
            onRestart={props.handleQuizRestart}
            t={props.t}
          />
        )}
      </main>
    </div>
  );
};