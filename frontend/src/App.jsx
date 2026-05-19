import React, { useState, useEffect } from 'react';
import { Film, Mail, Lock, User, LogIn, UserPlus, LogOut, Send, MessageSquare, Play, Trash2 } from 'lucide-react';
import axios from 'axios';

function App() {
  // --- 1. ВСЕ СОСТОЯНИЯ СТРОГО НА ВЕРХНЕМ УРОВНЕ ---
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  
  const [videos, setVideos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const API_URL = 'http://127.0.0.1:8000/api';

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Проверка токена при загрузке страницы
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUsername = localStorage.getItem('username');
    if (token) {
      setIsAuthenticated(true);
      if (savedUsername) setUsername(savedUsername);
    }
  }, []);

  // --- 2. ЭФФЕКТЫ ДЛЯ РАБОТЫ С ДАННЫМИ ДЖАНГО ---
  useEffect(() => {
    if (!isAuthenticated) return;

    // Первоначальная загрузка видео (работает всегда при входе)
    const fetchVideos = async () => {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const videoRes = await axios.get(`${API_URL}/videos/`, config);
        setVideos(videoRes.data);
      } catch (err) {
        console.error("Ошибка при загрузке списка видео:", err);
      }
    };
    fetchVideos();
  }, [isAuthenticated]);

  // Отдельный эффект для чата, который перезапускается ПРИ СМЕНЕ ВИДЕО
  useEffect(() => {
    if (!isAuthenticated || !activeVideo) {
      setMessages([]); // Если видео не выбрано — очищаем чат
      return;
    }

    const fetchChat = async () => {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        // Передаем video_id в запросе
        const chatRes = await axios.get(`${API_URL}/chat/?video_id=${activeVideo.id}`, config);
        setMessages(chatRes.data);
      } catch (err) {
        console.error("Ошибка при загрузке чата:", err);
      }
    };

    fetchChat();
    
    // Обновляем чат каждые 3 секунды СТРОГО для текущего видео
    const chatInterval = setInterval(async () => {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      try {
        const chatRes = await axios.get(`${API_URL}/chat/?video_id=${activeVideo.id}`, config);
        setMessages(chatRes.data);
      } catch (err) {
        console.error("Не удалось автоматически обновить чат", err);
      }
    }, 3000);

    return () => clearInterval(chatInterval);
  }, [isAuthenticated, activeVideo]); // <--- Срабатывает заново при смене activeVideo!

  // --- 3. ОБРАБОТЧИКИ ФОРМ И КНОПОК ---
  
  // Функция входа и регистрации
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    try {
      if (isLogin) {
        // Авторизация (Получение JWT токена) по правильному адресу auth/login/
        const response = await axios.post(`${API_URL}/auth/login/`, { username, password });
        localStorage.setItem('token', response.data.access);
        localStorage.setItem('username', username);
        setIsAuthenticated(true);
      } else {
        // Регистрация нового пользователя по правильному адресу auth/register/
        await axios.post(`${API_URL}/auth/register/`, { username, email, password });
        setMessage('Регистрация успешна! Теперь вы можете войти.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setIsError(true);
      console.error("Ошибка авторизации/регистрации:", err);
      setMessage(err.response?.data?.detail || err.response?.data?.username?.[0] || 'Произошла ошибка. Проверьте данные.');
    }
  };

  // Функция выхода
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setActiveVideo(null);
    setMessages([]);
    setPassword('');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeVideo) return; // Не отправляем, если видео не выбрано

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      // Отправляем текст И id текущего фильма
      const response = await axios.post(`${API_URL}/chat/`, { 
        text: newMessage,
        video_id: activeVideo.id 
      }, config);
      
      const optimizedMessage = {
        ...response.data,
        user: {
          username: username
        },
        video: activeVideo.id
      };

      setMessages([...messages, optimizedMessage]);
      setNewMessage('');
    } catch (err) {
      console.error("Ошибка при отправке сообщения:", err);
    }
  };

  const handleUploadVideo = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadFile) {
      alert("Пожалуйста, укажите название и выберите видеофайл");
      return;
    }

    const token = localStorage.getItem('token');
    const config = { 
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      } 
    };

    const formData = new FormData();
    formData.append('title', uploadTitle);
    formData.append('description', uploadDescription);
    formData.append('video_file', uploadFile);

    setIsUploading(true);
    try {
      const response = await axios.post(`${API_URL}/videos/`, formData, config);
      setVideos([...videos, response.data]);
      setUploadTitle('');
      setUploadDescription('');
      setUploadFile(null);
      document.getElementById('video-file-input').value = '';
      
      alert("Видео успешно загружено!");
    } catch (err) {
      console.error("Ошибка при загрузке видео:", err);
      alert("Не удалось загрузить видео. Проверьте консоль бэкенда.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId, e) => {
    e.stopPropagation(); 
    
    if (!window.confirm("Вы уверены, что хотите удалить это видео?")) return;

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    try {
      await axios.delete(`${API_URL}/videos/${videoId}/delete/`, config);
      setVideos(videos.filter(v => v.id !== videoId));
      
      if (activeVideo?.id === videoId) {
        setActiveVideo(null);
      }
      
      alert("Video успешно удалено");
    } catch (err) {
      console.error("Ошибка при удаления видео:", err);
      alert(err.response?.data?.detail || "Не удалось удалить видео.");
    }
  };

  // --- 4. ОТРИСОВКА ИНТЕРФЕЙСА ---
  if (isAuthenticated) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed text-slate-100 flex flex-col relative"
        style={{ backgroundImage: "url('/bg.png')" }}
      >
        {/* Затемняющая подложка поверх картинки */}
        <div className="absolute inset-0 bg-slate-950/40 z-0 pointer-events-none"></div>

        {/* Шапка */}
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Film className="w-6 h-6 text-white" />
            </div>
            {/* ИЗМЕНЕНО: Новое название */}
            <h1 className="text-xl font-black tracking-wider text-white uppercase">You<span className="text-indigo-500">Pipe</span></h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> {username || 'Пользователь'}
            </span>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1 bg-slate-800 hover:bg-red-900/40 hover:text-red-400 px-3 py-1.5 rounded-lg border border-slate-700 transition-all text-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </div>
        </header>

        {/* Основной контент */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden z-10 relative">
          
          {/* Левая колонка */}
          <div className="lg:col-span-3 p-6 flex flex-col space-y-6 overflow-y-auto">
            
            {/* Область видеоплеера */}
            <div className="w-full aspect-video bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              {activeVideo ? (
                <video 
                  key={activeVideo.id} 
                  src={`${API_URL}/videos/${activeVideo.id}/stream/`}
                  controls
                  preload="auto" 
                  className="w-full h-full object-contain"
                  autoPlay
                />
              ) : (
                <div className="text-center space-y-3 p-8">
                  <div className="w-16 h-16 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mx-auto text-indigo-400 animate-pulse">
                    <Play className="w-8 h-8 fill-current" />
                  </div>
                  <h3 className="text-lg font-semibold">Выберите видео для начала просмотра</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Стриминг запустится автоматически с использованием чанк-ответов Django.
                  </p>
                </div>
              )}
            </div>

            {/* Описание видео */}
            {activeVideo && (
              <div className="bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-slate-800 space-y-2">
                <h2 className="text-2xl font-bold text-white">{activeVideo.title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed">{activeVideo.description}</p>
              </div>
            )}

            {/* Список видео */}
            <div>
              <h3 className="text-lg font-bold text-slate-400 mb-4 tracking-wide uppercase text-xs">Доступные фильмы</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.length > 0 ? (
                  videos.map((video) => (
                    <div 
                      key={video.id}
                      className={`p-4 border rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                        activeVideo?.id === video.id 
                          ? 'bg-indigo-600/20 border-indigo-500' 
                          : 'bg-slate-900/90 backdrop-blur-md hover:bg-slate-850 border-slate-800'
                      }`}
                      onClick={() => setActiveVideo(video)}
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="p-2.5 bg-slate-800 rounded-lg text-indigo-400 flex-shrink-0">
                          <Play className="w-5 h-5 fill-current" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-white text-sm truncate">{video.title}</h4>
                          <p className="text-xs text-slate-500 truncate max-w-[180px]">{video.description}</p>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => handleDeleteVideo(video.id, e)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ml-2 flex-shrink-0"
                        title="Удалить видео"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-500 col-span-2 p-4 bg-slate-900/50 border border-dashed border-slate-800 rounded-xl text-center">
                    В базе данных Django пока нет загруженных видео. Опубликуйте форму ниже!
                  </div>
                )}
              </div>
            </div>

            {/* Форма загрузки */}
            <div className="mt-6 bg-slate-900/90 backdrop-blur-md p-5 rounded-xl border border-slate-800/80">
              <h3 className="text-base font-bold text-slate-200 mb-4">Добавить новое видео</h3>
              <form onSubmit={handleUploadVideo} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Название видео *</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="Введите название..."
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Описание</label>
                  <textarea
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 h-20 resize-none"
                    placeholder="Добавьте краткое описание..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Видеофайл (.mp4) *</label>
                  <input
                    id="video-file-input"
                    type="file"
                    accept="video/mp4"
                    className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-indigo-400 hover:file:bg-slate-700 file:cursor-pointer"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm py-2 rounded-lg transition duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? 'Загрузка...' : 'Опубликовать видео'}
                </button>
              </form>
            </div>
          </div>

          {/* Правая колонка: Чат */}
          <div className="bg-slate-900/90 backdrop-blur-md border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center space-x-2 text-slate-300 font-semibold bg-slate-900/50">
              <MessageSquare className="w-5 h-5 text-indigo-400" />
              <span>Чат</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 flex flex-col text-sm">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div key={msg.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-indigo-400 text-xs">
                        {msg.user?.username || 'Аноним'}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                      </span>
                    </div>
                    <p className="text-slate-300 break-words">{msg.text}</p>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-600 text-xs my-auto">
                  {activeVideo ? "Здесь пока нет сообщений. Напишите что-нибудь!" : "Выберите видео, чтобы увидеть сообщения."}
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950 flex items-center space-x-2">
              <input 
                type="text" 
                placeholder={activeVideo ? "Написать в чат..." : "Выберите видео, чтобы открыть чат"} 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={!activeVideo}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all disabled:opacity-50"
              />
              <button type="submit" disabled={!activeVideo} className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      </div>
    );
  }

  // --- ИЗМЕНЕНО: ЭКРАН ВХОДА С bg.png ФОНОМ ---
  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 relative" 
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      {/* Маска затемнения поверх картинки */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-0"></div>

      <div className="max-w-md w-full bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700 p-8 space-y-6 z-10">
        <div className="flex flex-col items-center space-y-2">
          <div className="p-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/30">
            <Film className="w-8 h-8 text-white" />
          </div>
          {/* ИЗМЕНЕНО: Новое название */}
          <h2 className="text-3xl font-black tracking-wider text-white uppercase">
            You<span className="text-indigo-500">Pipe</span>
          </h2>
          <p className="text-sm text-slate-400">
            {isLogin ? 'Данные для авторизации' : 'Данные для регистрации'}
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-xl text-sm font-medium text-center ${
            isError ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Имя пользователя (Логин)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {!isLogin && (
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="email"
                placeholder="Email адрес"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <button type="submit" className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer">
            {isLogin ? <><LogIn className="w-5 h-5" /><span>Войти</span></> : <><UserPlus className="w-5 h-5" /><span>Зарегистрироваться</span></>}
          </button>
        </form>

        <div className="text-center pt-2">
          <button onClick={() => { setIsLogin(!isLogin); setMessage(''); }} className="text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">
            {isLogin ? 'Ещё нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;