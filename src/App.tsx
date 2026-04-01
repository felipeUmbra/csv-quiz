import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, PlayCircle, Download, Moon, Sun, Settings, X } from 'lucide-react';
import Quiz, { Question } from './components/Quiz';
import { DEFAULT_CSV } from './data/defaultCsv';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || true;
    }
    return true;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [enableCustomQuestionCount, setEnableCustomQuestionCount] = useState(false);
  const [hideCorrectAnswer, setHideCorrectAnswer] = useState(false);
  
  // Estado para saber se o quiz chegou na tela de resultados
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  
  const [isConfiguringQuestions, setIsConfiguringQuestions] = useState(false);
  const [allParsedQuestions, setAllParsedQuestions] = useState<Question[]>([]);
  const [topicLimits, setTopicLimits] = useState<Record<string, number>>({});
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const parseCSV = (csvText: string, limit?: number) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          let parsedQuestions: Question[] = results.data.map((row: any) => {
            if (!row['pergunta'] || !row['alternativa correta']) {
              throw new Error('Formato de CSV inválido. Verifique as colunas "pergunta" e "alternativa correta".');
            }
            
            const options: Record<string, string> = {};
            Object.keys(row).forEach(key => {
              const match = key.toLowerCase().match(/^alternativa ([a-h])$/);
              if (match && row[key]?.trim()) {
                options[match[1]] = row[key].trim();
              }
            });

            const optionKeys = Object.keys(options);
            if (optionKeys.length < 2 || optionKeys.length > 8) {
              throw new Error(`A pergunta "${row['pergunta']}" deve ter entre 2 e 8 alternativas.`);
            }

            const correct = row['alternativa correta'].toLowerCase().trim();
            if (!options[correct]) {
              throw new Error(`A alternativa correta "${correct}" não corresponde a nenhuma das alternativas fornecidas para a pergunta "${row['pergunta']}".`);
            }

            const optionsArray = Object.keys(options).map(k => ({ originalKey: k, value: options[k] }));
            const shuffledArray = optionsArray.sort(() => Math.random() - 0.5);
            
            const newOptions: Record<string, string> = {};
            let newCorrect = '';
            const alphabet = 'abcdefghijklmnopqrstuvwxyz';
            
            shuffledArray.forEach((item, index) => {
              const newKey = alphabet[index];
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
          
          if (parsedQuestions.length === 0) {
            throw new Error('Nenhuma pergunta encontrada no arquivo.');
          }

          parsedQuestions = parsedQuestions.sort(() => 0.5 - Math.random());

          if (enableCustomQuestionCount) {
            const counts: Record<string, number> = {};
            parsedQuestions.forEach(q => {
              counts[q.topic] = (counts[q.topic] || 0) + 1;
            });
            
            setTopicCounts(counts);
            setTopicLimits(counts);
            setAllParsedQuestions(parsedQuestions);
            setIsConfiguringQuestions(true);
            setError(null);
          } else {
            if (limit && limit > 0) {
              parsedQuestions = parsedQuestions.slice(0, limit);
            }
            setQuestions(parsedQuestions);
            setIsStarted(true);
            setIsQuizFinished(false); // Reseta ao iniciar
            setError(null);
          }
        } catch (err: any) {
          setError(err.message || 'Erro ao processar o arquivo CSV.');
        }
      },
      error: (err) => {
        setError(`Erro ao ler o arquivo: ${err.message}`);
      }
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Por favor, envie um arquivo CSV válido.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const loadDefaultQuiz = () => {
    parseCSV(DEFAULT_CSV, 5);
  };

  const restartQuiz = () => {
    setIsStarted(false);
    setIsConfiguringQuestions(false);
    setIsQuizFinished(false); // Reseta ao sair
    setQuestions([]);
    setAllParsedQuestions([]);
    setError(null);
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
      setError('Selecione pelo menos uma questão para iniciar o quiz.');
      return;
    }

    finalQuestions = finalQuestions.sort(() => 0.5 - Math.random());
    setQuestions(finalQuestions);
    setIsConfiguringQuestions(false);
    setIsStarted(true);
    setIsQuizFinished(false); // Garante que o quiz não comece finalizado
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-200">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">CSV Quiz Generator</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Alternar tema claro/escuro"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {/* LOGICA DE EXIBIÇÃO: Só mostra se NÃO começou (tela inicial) ou se o Quiz JÁ terminou */}
            {((!isStarted && !isConfiguringQuestions) || isQuizFinished) && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Configurações"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {(isStarted || isConfiguringQuestions) && (
              <button 
                onClick={restartQuiz}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors print:hidden"
              >
                Sair do Quiz
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium max-w-2xl mx-auto text-center">
            {error}
          </div>
        )}

        {isConfiguringQuestions ? (
          <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Configurar Questões por Tópico</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Defina a quantidade de perguntas que deseja extrair de cada tópico.</p>
            
            <div className="space-y-4 mb-8">
              {Object.keys(topicCounts).map(topic => (
                <div key={topic} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">{topic}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Total disponível: {topicCounts[topic]}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Qtd:</label>
                    <input
                      type="number"
                      min="0"
                      max={topicCounts[topic]}
                      value={topicLimits[topic]}
                      onChange={(e) => handleTopicLimitChange(topic, parseInt(e.target.value))}
                      className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-center font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-end border-t border-slate-100 dark:border-slate-800 pt-6">
              <button
                onClick={restartQuiz}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                onClick={startCustomQuiz}
                className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors w-full sm:w-auto"
              >
                Iniciar Quiz
              </button>
            </div>
          </div>
        ) : !isStarted ? (
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-6">
              Transforme seus dados em conhecimento
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
              Faça upload de um arquivo CSV contendo perguntas e alternativas para gerar um questionário interativo instantaneamente.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="relative group rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[240px]">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Fazer Upload de CSV</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  Arraste e solte ou clique para selecionar seu arquivo.
                </p>
              </div>

              <div 
                onClick={loadDefaultQuiz}
                className="rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[240px]"
              >
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mb-4 hover:scale-110 transition-transform">
                  <PlayCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Testar Exemplo</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                  Carregue o questionário padrão sobre Fundamentos de Teste.
                </p>
              </div>
            </div>

            <div className="mt-12 text-left bg-slate-100 dark:bg-slate-800/50 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">Formato Esperado do CSV</h4>
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Modelo CSV
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-slate-600 dark:text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-slate-700">
                      <th className="pb-2 font-medium text-left">Topico</th>
                      <th className="pb-2 font-medium text-left">pergunta</th>
                      <th className="pb-2 font-medium text-left">alternativa correta</th>
                      <th className="pb-2 font-medium text-left">alternativa a</th>
                      <th className="pb-2 font-medium text-left">alternativa b</th>
                      <th className="pb-2 font-medium text-left">... (até h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="pt-2">Matemática</td>
                      <td className="pt-2">Quanto é 2+2?</td>
                      <td className="pt-2">a</td>
                      <td className="pt-2">4</td>
                      <td className="pt-2">...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <Quiz 
            questions={questions} 
            onExit={restartQuiz} 
            hideCorrectAnswer={hideCorrectAnswer}
            onFinish={() => setIsQuizFinished(true)} 
            onRestart={() => setIsQuizFinished(false)}
          />
        )}
      </main>

      {/* Janela Flutuante de Configurações */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Configurações
              </h2>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex items-center h-6">
                    <input
                      type="checkbox"
                      checked={enableCustomQuestionCount}
                      onChange={(e) => setEnableCustomQuestionCount(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:checked:bg-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <span className="text-base font-medium text-slate-900 dark:text-white block mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Definir número de Questões
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Permite escolher a quantidade exata de perguntas por tópico antes de iniciar o quiz.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex items-center h-6">
                    <input
                      type="checkbox"
                      checked={hideCorrectAnswer}
                      onChange={(e) => setHideCorrectAnswer(e.target.checked)}
                      className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900 dark:checked:bg-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <span className="text-base font-medium text-slate-900 dark:text-white block mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      Omitir resposta correta
                    </span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Não exibe qual era a alternativa correta caso você erre a questão.
                    </span>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}