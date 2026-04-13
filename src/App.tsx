/// <reference types="vite/client" />
import React, { useState, useEffect, useRef } from 'react';
import Papa from 'papaparse';
import { Question } from './components/Quiz';
import { AppView } from './components/AppView';
import { Language, translations } from './translations';

export interface SavedQuiz {
  id: string;
  name: string;
  date: string;
  questions: Question[];
  highestScore?: number;
}

/**
 * The main Container Component for the CSV Quiz application.
 * It manages the core business logic, including state persistence (localStorage),
 * CSV parsing orchestration, theme switching, and language localization.
 */
export default function App() {
  // --- Core Quiz Session State ---
  /** The subset of questions currently loaded into the active quiz session. */
  const [questions, setQuestions] = useState<Question[]>([]);
  /** Boolean flag indicating if a quiz is currently being taken. */
  const [isStarted, setIsStarted] = useState(false);
  /** Global error message state used to display feedback during file processing or validation. */
  const [error, setError] = useState<string | null>(null);
  
  /** Theme state: managed via the 'dark' class on the document element for Tailwind CSS. */
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  // --- UI & Library State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  /** Collection of quizzes stored in localStorage, updated when users save new uploads. */
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>(() => {
    const stored = localStorage.getItem('saved-quizzes');
    return stored ? JSON.parse(stored) : [];
  });
  /** Controls the visibility of the saved quizzes (library) popover. */
  const [isSavedQuizzesOpen, setIsSavedQuizzesOpen] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [enableCustomQuestionCount, setEnableCustomQuestionCount] = useState(false);
  const [hideCorrectAnswer, setHideCorrectAnswer] = useState(false);
  
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('language');
    return (stored as Language) || 'pt';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = translations[language];

  const [isQuizFinished, setIsQuizFinished] = useState(false);
  /** Tracks which saved quiz is currently being played to update the 'highestScore'. */
  const [activeSavedQuizId, setActiveSavedQuizId] = useState<string | null>(null);
  
  // --- CSV Processing State ---
  /** Boolean flag for the intermediate step where users choose question counts per topic. */
  const [isConfiguringQuestions, setIsConfiguringQuestions] = useState(false);
  /** The full pool of questions parsed from the current CSV, before any topic filtering. */
  const [allParsedQuestions, setAllParsedQuestions] = useState<Question[]>([]);
  /** Questions waiting for user action (save/run) after a successful upload. */
  const [pendingQuestions, setPendingQuestions] = useState<Question[] | null>(null);
  
  // --- Topic Mapping State ---
  const [topicLimits, setTopicLimits] = useState<Record<string, number>>({});
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});

  const [isExamplePopoverOpen, setIsExamplePopoverOpen] = useState(false);

  // Refs for the settings button and popover content to handle click-outside
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsPopoverRef = useRef<HTMLDivElement>(null);
  const savedQuizzesButtonRef = useRef<HTMLButtonElement>(null);
  const savedQuizzesPopoverRef = useRef<HTMLDivElement>(null);
  const exampleButtonRef = useRef<HTMLDivElement>(null);
  const examplePopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Effect to handle clicking outside the popover to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsPopoverRef.current &&
        !settingsPopoverRef.current.contains(event.target as Node) &&
        settingsButtonRef.current &&
        !settingsButtonRef.current.contains(event.target as Node)
      ) {
        setIsSettingsOpen(false);
      }

      if (
        savedQuizzesPopoverRef.current &&
        !savedQuizzesPopoverRef.current.contains(event.target as Node) &&
        savedQuizzesButtonRef.current &&
        !savedQuizzesButtonRef.current.contains(event.target as Node)
      ) {
        setIsSavedQuizzesOpen(false);
      }

      if (
        examplePopoverRef.current &&
        !examplePopoverRef.current.contains(event.target as Node) &&
        exampleButtonRef.current &&
        !exampleButtonRef.current.contains(event.target as Node)
      ) {
        setIsExamplePopoverOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSettingsOpen, isSavedQuizzesOpen, isExamplePopoverOpen]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  /**
   * Parses raw CSV text into a structured Question array.
   * Handles data validation, option shuffling, and error mapping for common CSV issues.
   * 
   * @param csvText - The raw string content of the CSV file.
   * @param onComplete - Callback executed with the parsed questions upon success.
   */
  const parseCSV = (csvText: string, onComplete: (qs: Question[]) => void) => {
    setActiveSavedQuizId(null);
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          let parsedQuestions: Question[] = results.data.map((row: any) => {
            if (!row['pergunta'] || !row['alternativa correta']) {
              throw new Error('Formato de CSV inválido. Verifique as colunas "pergunta" e "alternativa correta".');
            }
            
            // 3. Verificação se existe resposta correta indicada
            if (!row['alternativa correta'] || row['alternativa correta'].trim() === '') {
              throw new Error(`A "alternativa correta" não foi especificada para a pergunta "${row['pergunta']}".`);
            }

            const options: Record<string, string> = {};
            Object.keys(row).forEach(key => {
              const match = key.toLowerCase().match(/^alternativa ([a-h])$/);
              if (match && row[key] && row[key].trim() !== '') {
                options[match[1]] = row[key].trim();
              }
            });

            // 4. Verificação se há pelo menos as alternativas 'a' e 'b'
            if (!options['a'] || !options['b']) {
              throw new Error(`A pergunta "${row['pergunta']}" deve ter pelo menos as "alternativa a" e "alternativa b" preenchidas.`);
            }

            const correct = row['alternativa correta'].toLowerCase().trim();
            
            // Verificação extra para garantir que a alternativa correta apontada realmente existe entre as opções
            if (!options[correct]) {
              throw new Error(`A alternativa correta apontada ("${correct}") está vazia ou não existe nas opções desta pergunta.`);
            }

            const optionsArray = Object.keys(options).map(k => ({ originalKey: k, value: options[k] }));
            const shuffledArray = optionsArray.sort(() => Math.random() - 0.5);
            
            const newOptions: Record<string, string> = {};
            let newCorrect = '';
            const alphabet = 'abcdefghijklmnopqrstuvwxyz';
            
            shuffledArray.forEach((item, idx) => {
              const newKey = alphabet[idx];
              newOptions[newKey] = item.value;
              if (item.originalKey === correct) {
                newCorrect = newKey;
              }
            });

            return {
              topic: row['Topico'] || 'Geral',
              question: row['pergunta'],
              correct: newCorrect,
              options: newOptions
            };
          });

          parsedQuestions = parsedQuestions.sort(() => 0.5 - Math.random());
          onComplete(parsedQuestions);
          setError(null);
        } catch (err: any) {
          setError(err.message || 'Erro ao processar o arquivo CSV.');
        }
      },
      error: (err: any) => {
        setError(`Erro ao ler o arquivo: ${err.message}`);
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) {
      return;
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Por favor, envie um arquivo CSV válido.');
      event.target.value = ''; // Limpa o input em caso de erro de formato
      return;
    }

    // Limpa os erros anteriores ao tentar um novo upload
    setError(null); 

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text, (qs) => setPendingQuestions(qs));
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const loadExampleQuiz = (csv: string) => {
    parseCSV(csv, (qs) => {
      startQuizWithQuestions(qs.slice(0, 5));
    });
    setIsExamplePopoverOpen(false);
  };

  const restartQuiz = () => {
    setIsStarted(false);
    setIsConfiguringQuestions(false);
    setIsQuizFinished(false);
    setQuestions([]);
    setAllParsedQuestions([]);
    setActiveSavedQuizId(null);
    setError(null);
  };

  const startQuizWithQuestions = (questionsToUse: Question[]) => {
    const counts: Record<string, number> = {};
    questionsToUse.forEach(q => {
      counts[q.topic] = (counts[q.topic] || 0) + 1;
    });
    
    setTopicCounts(counts);
    setTopicLimits(counts);
    setAllParsedQuestions(questionsToUse);
    setIsQuizFinished(false);

    if (enableCustomQuestionCount) {
      setIsConfiguringQuestions(true);
      setIsStarted(false);
    } else {
      setQuestions(questionsToUse);
      setIsStarted(true);
      setIsConfiguringQuestions(false);
    }
  };

  const handleQuizRestart = () => {
    setIsQuizFinished(false);
    if (enableCustomQuestionCount) {
      setIsStarted(false);
      setIsConfiguringQuestions(true);
      const counts: Record<string, number> = {};
      allParsedQuestions.forEach(q => counts[q.topic] = (counts[q.topic] || 0) + 1);
      setTopicCounts(counts);
      setTopicLimits(prev => Object.keys(prev).length > 0 ? prev : counts);
    } else {
      setQuestions([...allParsedQuestions].sort(() => 0.5 - Math.random()));
    }
  };

  // Nova função para lidar com "Fazer Novamente"
  const handlePlayAgainApp = () => {
    if (enableCustomQuestionCount) {
      // Se a opção estiver ativa, manda pra tela de configuração antes de iniciar
      setIsQuizFinished(false);
      setIsStarted(false);
      setIsConfiguringQuestions(true);
    } else {
      // Se estiver desativada, embaralha todas as perguntas novamente
      const shuffled = [...allParsedQuestions].sort(() => 0.5 - Math.random());
      setQuestions(shuffled);
      setIsQuizFinished(false);
    }
  };

  const handleSaveQuiz = (quizQuestions: Question[]) => {
    // Generate a unique ID with a fallback for non-secure contexts (HTTP) or older browsers
    const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID) 
      ? crypto.randomUUID() 
      : Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

    const newQuiz: SavedQuiz = {
      id: uuid,
      name: `Simulado - ${quizQuestions[0]?.topic || 'Geral'}`,
      date: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      questions: quizQuestions,
    };
    const updated = [newQuiz, ...savedQuizzes];
    setSavedQuizzes(updated);
    localStorage.setItem('saved-quizzes', JSON.stringify(updated));
    alert(t.savedSuccess);
  };

  const handleUploadAction = (action: 'save' | 'run' | 'both') => {
    if (!pendingQuestions) return;

    const questionsToUse = [...pendingQuestions];
    
    if (action === 'save' || action === 'both') {
      handleSaveQuiz(questionsToUse);
    }

    if (action === 'run' || action === 'both') {
      startQuizWithQuestions(questionsToUse);
    }

    setPendingQuestions(null);
  };

  const handleQuizFinish = (finalScore: number) => {
    setIsQuizFinished(true);
    if (activeSavedQuizId) {
      const updated = savedQuizzes.map(q => {
        if (q.id === activeSavedQuizId) {
          const currentPercentage = Math.round((finalScore / questions.length) * 100);
          const oldPercentage = q.highestScore ?? -1;
          return { ...q, highestScore: Math.max(oldPercentage, currentPercentage) };
        }
        return q;
      });
      setSavedQuizzes(updated);
      localStorage.setItem('saved-quizzes', JSON.stringify(updated));
    }
  };

  const loadSavedQuiz = (quiz: SavedQuiz) => {
    setActiveSavedQuizId(quiz.id);
    startQuizWithQuestions(quiz.questions);
    setIsSavedQuizzesOpen(false);
    setError(null);
  };

  const renameSavedQuiz = (id: string, newName: string) => {
    if (!newName.trim()) return;
    const updated = savedQuizzes.map(q => q.id === id ? { ...q, name: newName } : q);
    setSavedQuizzes(updated);
    localStorage.setItem('saved-quizzes', JSON.stringify(updated));
    setEditingQuizId(null);
  };

  const deleteSavedQuiz = (id: string) => {
    const updated = savedQuizzes.filter(q => q.id !== id);
    setSavedQuizzes(updated);
    localStorage.setItem('saved-quizzes', JSON.stringify(updated));
  };

  const downloadTemplate = () => {
    const templateContent = "Topico,pergunta,alternativa correta,alternativa a,alternativa b,alternativa c,alternativa d\nConhecimentos Gerais,Qual é a capital do Brasil?,a,Brasília,Rio de Janeiro,São Paulo,Salvador\nMatemática,Quanto é 2 + 2?,c,3,5,4,6";
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modelo_quiz.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTopicLimitChange = (topic: string, value: number) => {
    const max = topicCounts[topic];
    let newValue = value;
    if (isNaN(newValue) || newValue < 0) newValue = 0;
    if (newValue > max) newValue = max;
    
    setTopicLimits(prev => ({ ...prev, [topic]: newValue }));
  };

  /**
   * Finalizes the custom quiz configuration.
   * Filters 'allParsedQuestions' based on user-defined limits per topic,
   * shuffles the final selection, and transitions to the Quiz view.
   */
  const startCustomQuiz = () => {
    let finalQuestions: Question[] = [];
    
    Object.keys(topicLimits).forEach(topic => {
      const limit = topicLimits[topic];
      if (limit > 0) {
        const topicQuestions = allParsedQuestions.filter(q => q.topic === topic);
        finalQuestions = [...finalQuestions, ...topicQuestions.slice(0, limit)];
      }
    });
    
    if (finalQuestions.length === 0) {
      setError(t.selectAtLeastOne);
      return;
    }

    finalQuestions = finalQuestions.sort(() => 0.5 - Math.random());
    setQuestions(finalQuestions);
    setIsConfiguringQuestions(false);
    setIsStarted(true);
    setIsQuizFinished(false);
    setError(null);
  };

  return (
    <AppView
      isDarkMode={isDarkMode}
      isStarted={isStarted}
      isConfiguringQuestions={isConfiguringQuestions}
      isQuizFinished={isQuizFinished}
      error={error}
      pendingQuestions={pendingQuestions}
      topicCounts={topicCounts}
      topicLimits={topicLimits}
      isSavedQuizzesOpen={isSavedQuizzesOpen}
      isSettingsOpen={isSettingsOpen}
      savedQuizzes={savedQuizzes}
      editingQuizId={editingQuizId}
      editingName={editingName}
      enableCustomQuestionCount={enableCustomQuestionCount}
      hideCorrectAnswer={hideCorrectAnswer}
      isExamplePopoverOpen={isExamplePopoverOpen}
      questions={questions}
      language={language}
      t={t}
      setLanguage={setLanguage}
      toggleDarkMode={toggleDarkMode}
      setIsSavedQuizzesOpen={setIsSavedQuizzesOpen}
      setIsSettingsOpen={setIsSettingsOpen}
      setEnableCustomQuestionCount={setEnableCustomQuestionCount}
      setHideCorrectAnswer={setHideCorrectAnswer}
      setEditingQuizId={setEditingQuizId}
      setEditingName={setEditingName}
      setPendingQuestions={setPendingQuestions}
      setIsExamplePopoverOpen={setIsExamplePopoverOpen}
      handleFileUpload={handleFileUpload}
      handleUploadAction={handleUploadAction}
      handleTopicLimitChange={handleTopicLimitChange}
      restartQuiz={restartQuiz}
      startCustomQuiz={startCustomQuiz}
      handleQuizRestart={handleQuizRestart}
      handleSaveQuiz={handleSaveQuiz}
      handleQuizFinish={handleQuizFinish}
      renameSavedQuiz={renameSavedQuiz}
      deleteSavedQuiz={deleteSavedQuiz}
      loadSavedQuiz={loadSavedQuiz}
      loadExampleQuiz={loadExampleQuiz}
      downloadTemplate={downloadTemplate}
      settingsButtonRef={settingsButtonRef}
      settingsPopoverRef={settingsPopoverRef}
      savedQuizzesButtonRef={savedQuizzesButtonRef}
      savedQuizzesPopoverRef={savedQuizzesPopoverRef}
      exampleButtonRef={exampleButtonRef}
      examplePopoverRef={examplePopoverRef}
    />
  );
}