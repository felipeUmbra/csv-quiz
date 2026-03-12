import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, PlayCircle, Download, Moon, Sun } from 'lucide-react';
import Quiz, { Question } from './components/Quiz';
import { DEFAULT_CSV } from './data/defaultCsv';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || true; // Default to dark mode for better aesthetics, can be changed by user
    }
    return true; // Default to dark mode on server-side rendering
  });

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
          // 1. Verificação se o arquivo tem dados/perguntas
          if (!results.data || results.data.length === 0) {
            throw new Error('Nenhuma pergunta encontrada no arquivo CSV.');
          }

          let parsedQuestions: Question[] = results.data.map((row: any, index: number) => {
            const linhaCSV = index + 2; // +1 pelo cabeçalho, +1 porque o index começa em 0

            // 2. Verificação se existe pergunta na linha
            if (!row['pergunta'] || row['pergunta'].trim() === '') {
              throw new Error(`Erro na linha ${linhaCSV}: A coluna "pergunta" está vazia ou não existe.`);
            }
            
            // 3. Verificação se existe resposta correta indicada
            if (!row['alternativa correta'] || row['alternativa correta'].trim() === '') {
              throw new Error(`Erro na linha ${linhaCSV}: A "alternativa correta" não foi especificada para a pergunta "${row['pergunta']}".`);
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
              throw new Error(`Erro na linha ${linhaCSV}: A pergunta "${row['pergunta']}" deve ter pelo menos as "alternativa a" e "alternativa b" preenchidas.`);
            }

            const correct = row['alternativa correta'].toLowerCase().trim();
            
            // Verificação extra para garantir que a alternativa correta apontada realmente existe entre as opções
            if (!options[correct]) {
              throw new Error(`Erro na linha ${linhaCSV}: A alternativa correta apontada ("${correct}") está vazia ou não existe nas opções desta pergunta.`);
            }

            // Embaralhar as alternativas
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

          // Embaralha a ordem de todas as perguntas
          parsedQuestions = parsedQuestions.sort(() => 0.5 - Math.random());

          if (limit && limit > 0) {
            parsedQuestions = parsedQuestions.slice(0, limit);
          }

          setQuestions(parsedQuestions);
          setIsStarted(true);
          setError(null);
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
      parseCSV(text);
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo.');
    };
    
    reader.readAsText(file);

    // ESSA É A LINHA MÁGICA: 
    // Reseta o valor do input para permitir o reenvio do mesmo arquivo
    event.target.value = ''; 
  };

  const loadDefaultQuiz = () => {
    parseCSV(DEFAULT_CSV, 5);
  };

  const restartQuiz = () => {
    setIsStarted(false);
    setQuestions([]);
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
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {isStarted && (
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
        {!isStarted ? (
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl mb-6">
              Transforme seus dados em conhecimento
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 mb-12">
              Faça upload de um arquivo CSV contendo perguntas e alternativas para gerar um questionário interativo instantaneamente.
            </p>

            {error && (
              <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Upload Card */}
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

              {/* Default Quiz Card */}
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
          <Quiz questions={questions} onExit={restartQuiz} />
        )}
      </main>
    </div>
  );
}
