// Quiz Application
class InteractiveQuiz {
    constructor() {
        this.questions = [];
        this.currentQuestions = [];
        this.userAnswers = {};
        this.timer = null;
        this.timeLeft = 60 * 60; // 60 minutes in seconds
        this.testStarted = false;
        this.shuffledOrders = new Map();
        
        this.initialize();
    }

    initialize() {
        this.loadQuestions();
        this.setupEventListeners();
        this.loadTheme();
        this.startTimer();
        this.updateUnansweredCount();
    }

    loadQuestions() {
        // Questions are loaded from questions.js
        this.questions = window.quizQuestions || [];
        this.selectRandomQuestions();
        this.renderQuestions();
    }

    selectRandomQuestions() {
        // Select 50 random questions
        const shuffled = [...this.questions].sort(() => Math.random() - 0.5);
        this.currentQuestions = shuffled.slice(0, 50);
        
        // Initialize shuffled orders for each multiple choice question
        this.currentQuestions.forEach((question, index) => {
            if (question.type === 'multiple' && question.options) {
                const shuffledOptions = [...question.options].sort(() => Math.random() - 0.5);
                this.shuffledOrders.set(index, shuffledOptions);
            }
        });
    }

    renderQuestions() {
        const container = document.getElementById('questionsContainer');
        container.innerHTML = '';

        this.currentQuestions.forEach((question, index) => {
            const questionElement = this.createQuestionElement(question, index);
            container.appendChild(questionElement);
        });
    }

    createQuestionElement(question, index) {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question-card';
        questionDiv.dataset.questionId = index;

        const questionNumber = index + 1;
        let optionsHtml = '';

        if (question.type === 'truefalse') {
            optionsHtml = `
                <div class="options-container">
                    <label class="option ${this.userAnswers[index] === 'صح' ? 'selected' : ''}">
                        <input type="radio" name="question_${index}" value="صح" 
                               ${this.userAnswers[index] === 'صح' ? 'checked' : ''}>
                        صح
                    </label>
                    <label class="option ${this.userAnswers[index] === 'خطأ' ? 'selected' : ''}">
                        <input type="radio" name="question_${index}" value="خطأ"
                               ${this.userAnswers[index] === 'خطأ' ? 'checked' : ''}>
                        خطأ
                    </label>
                </div>
            `;
        } else {
            const shuffledOptions = this.shuffledOrders.get(index) || question.options;
            optionsHtml = `
                <div class="options-container">
                    ${shuffledOptions.map((option, optIndex) => `
                        <label class="option ${this.userAnswers[index] === option ? 'selected' : ''}">
                            <input type="radio" name="question_${index}" value="${option}"
                                   ${this.userAnswers[index] === option ? 'checked' : ''}>
                            ${option}
                        </label>
                    `).join('')}
                </div>
            `;
        }

        questionDiv.innerHTML = `
            <div class="question-header">
                <span class="question-number">السؤال ${questionNumber}</span>
                <span class="question-type">${question.type === 'truefalse' ? 'صح/خطأ' : 'اختيار من متعدد'}</span>
            </div>
            <div class="question-text">${question.question}</div>
            ${optionsHtml}
        `;

        // Add event listeners to options
        questionDiv.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.userAnswers[index] = e.target.value;
                this.updateOptionStyles(questionDiv, e.target.value);
                this.updateUnansweredCount();
                this.saveProgress();
            });
        });

        return questionDiv;
    }

    updateOptionStyles(questionDiv, selectedValue) {
        questionDiv.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
            if (option.querySelector('input').value === selectedValue) {
                option.classList.add('selected');
            }
        });
    }

    updateUnansweredCount() {
        const answeredCount = Object.keys(this.userAnswers).length;
        const unansweredCount = this.currentQuestions.length - answeredCount;
        
        const alertElement = document.getElementById('unansweredAlert');
        const countElement = document.getElementById('unansweredCount');
        
        countElement.textContent = unansweredCount;
        
        if (unansweredCount > 0) {
            alertElement.style.display = 'flex';
        } else {
            alertElement.style.display = 'none';
        }
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            
            const minutes = Math.floor(this.timeLeft / 60);
            const seconds = this.timeLeft % 60;
            
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
            
            // Update progress bar
            const progressPercentage = (this.timeLeft / (60 * 60)) * 100;
            document.getElementById('progressBar').style.width = `${progressPercentage}%`;
            
            // Change progress bar color based on time
            if (progressPercentage < 20) {
                document.getElementById('progressBar').style.background = 'linear-gradient(to right, #e74c3c, #c0392b)';
            } else if (progressPercentage < 50) {
                document.getElementById('progressBar').style.background = 'linear-gradient(to right, #f39c12, #d68910)';
            }
            
            // Show warning when less than 10 minutes
            if (minutes < 10 && minutes > 0) {
                document.getElementById('timerWarning').style.display = 'flex';
            }
            
            // Time's up
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.submitTest();
            }
            
            this.saveProgress();
        }, 1000);
    }

    submitTest() {
        clearInterval(this.timer);
        
        // Calculate score
        let correctCount = 0;
        this.currentQuestions.forEach((question, index) => {
            if (this.userAnswers[index] === question.answer) {
                correctCount++;
            }
        });
        
        const scorePercentage = Math.round((correctCount / this.currentQuestions.length) * 100);
        
        // Update results display
        document.getElementById('scorePercentage').textContent = scorePercentage;
        document.getElementById('correctCount').textContent = correctCount;
        document.getElementById('totalQuestions').textContent = this.currentQuestions.length;
        
        // Calculate time taken
        const timeTaken = 60 * 60 - this.timeLeft;
        const takenMinutes = Math.floor(timeTaken / 60);
        const takenSeconds = timeTaken % 60;
        document.getElementById('timeTaken').textContent = 
            `${takenMinutes.toString().padStart(2, '0')}:${takenSeconds.toString().padStart(2, '0')}`;
        
        // Show results section
        document.getElementById('questionsContainer').style.display = 'none';
        document.getElementById('unansweredAlert').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        
        // Render answers review
        this.renderAnswersReview();
        
        // Show confetti if score is good
        if (scorePercentage >= 70) {
            this.showConfetti();
        }
        
        // Save results
        this.saveResults(scorePercentage, correctCount);
    }

    renderAnswersReview() {
        const reviewContainer = document.getElementById('answersReview');
        reviewContainer.innerHTML = '';
        
        this.currentQuestions.forEach((question, index) => {
            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-item';
            
            const userAnswer = this.userAnswers[index] || 'لم يتم الإجابة';
            const isCorrect = userAnswer === question.answer;
            const questionNumber = index + 1;
            
            let optionsHtml = '';
            if (question.type === 'multiple') {
                const shuffledOptions = this.shuffledOrders.get(index) || question.options;
                optionsHtml = shuffledOptions.map(option => {
                    let className = 'review-answer';
                    if (option === question.answer) {
                        className += ' correct';
                    } else if (option === userAnswer && !isCorrect) {
                        className += ' incorrect';
                    }
                    return `<div class="${className}">${option}</div>`;
                }).join('');
            }
            
            reviewItem.innerHTML = `
                <div class="review-question">
                    <h4>السؤال ${questionNumber}: ${question.question}</h4>
                    <p>إجابتك: <strong>${userAnswer}</strong></p>
                    <p>الإجابة الصحيحة: <strong class="correct-answer">${question.answer}</strong></p>
                    ${question.explanation ? `
                        <div class="review-explanation">
                            <strong>الشرح:</strong> ${question.explanation}
                        </div>
                    ` : ''}
                </div>
                ${optionsHtml}
            `;
            
            reviewContainer.appendChild(reviewItem);
        });
    }

    showConfetti() {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
        
        setTimeout(() => {
            confetti({
                particleCount: 100,
                angle: 60,
                spread: 55,
                origin: { x: 0 }
            });
            
            confetti({
                particleCount: 100,
                angle: 120,
                spread: 55,
                origin: { x: 1 }
            });
        }, 250);
    }

    saveProgress() {
        const progress = {
            userAnswers: this.userAnswers,
            timeLeft: this.timeLeft,
            currentQuestions: this.currentQuestions.map(q => q.id),
            shuffledOrders: Array.from(this.shuffledOrders.entries())
        };
        localStorage.setItem('quizProgress', JSON.stringify(progress));
    }

    loadProgress() {
        const saved = localStorage.getItem('quizProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            this.userAnswers = progress.userAnswers || {};
            this.timeLeft = progress.timeLeft || 60 * 60;
            
            if (progress.currentQuestions) {
                this.currentQuestions = progress.currentQuestions.map(id => 
                    this.questions.find(q => q.id === id)
                ).filter(q => q);
            }
            
            if (progress.shuffledOrders) {
                this.shuffledOrders = new Map(progress.shuffledOrders);
            }
            
            return true;
        }
        return false;
    }

    saveResults(score, correctCount) {
        const results = {
            score: score,
            correctCount: correctCount,
            totalQuestions: this.currentQuestions.length,
            timestamp: new Date().toISOString()
        };
        
        const allResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
        allResults.push(results);
        localStorage.setItem('quizResults', JSON.stringify(allResults.slice(-10))); // Keep last 10 results
    }

    saveTheme(theme) {
        localStorage.setItem('quizTheme', theme);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('quizTheme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeButton(savedTheme);
    }

    updateThemeButton(theme) {
        const button = document.getElementById('themeToggle');
        const icon = button.querySelector('i');
        const text = theme === 'dark' ? 'وضع نهاري' : 'وضع ليلي';
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        button.innerHTML = `<i class="${icon.className}"></i> ${text}`;
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            this.saveTheme(newTheme);
            this.updateThemeButton(newTheme);
        });

        // Submit button
        document.getElementById('submitBtn').addEventListener('click', () => {
            if (confirm('هل أنت متأكد من إنهاء الاختبار؟')) {
                this.submitTest();
            }
        });

        // Shuffle questions
        document.getElementById('shuffleQuestions').addEventListener('click', () => {
            this.selectRandomQuestions();
            this.userAnswers = {};
            this.shuffledOrders.clear();
            this.renderQuestions();
            this.updateUnansweredCount();
            this.saveProgress();
        });

        // Retry same test
        document.getElementById('retrySameBtn').addEventListener('click', () => {
            this.userAnswers = {};
            this.timeLeft = 60 * 60;
            this.startTimer();
            this.updateUnansweredCount();
            this.renderQuestions();
            
            document.getElementById('resultsSection').style.display = 'none';
            document.getElementById('questionsContainer').style.display = 'block';
        });

        // New test
        document.getElementById('newTestBtn').addEventListener('click', () => {
            this.selectRandomQuestions();
            this.userAnswers = {};
            this.timeLeft = 60 * 60;
            this.shuffledOrders.clear();
            this.startTimer();
            this.updateUnansweredCount();
            this.renderQuestions();
            
            document.getElementById('resultsSection').style.display = 'none';
            document.getElementById('questionsContainer').style.display = 'block';
        });

        // Download results
        document.getElementById('downloadResults').addEventListener('click', () => {
            this.downloadResults();
        });
    }

    downloadResults() {
        const resultsText = `
نتائج اختبار علم النفس الإعلامي
جامعة صنعاء - كلية الإعلام
تاريخ: ${new Date().toLocaleDateString('ar-SA')}
الوقت: ${new Date().toLocaleTimeString('ar-SA')}

النتيجة: ${document.getElementById('scorePercentage').textContent}%
الإجابات الصحيحة: ${document.getElementById('correctCount').textContent}/${document.getElementById('totalQuestions').textContent}
الوقت المستغرق: ${document.getElementById('timeTaken').textContent}

${this.currentQuestions.map((q, i) => `
السؤال ${i + 1}: ${q.question}
إجابتك: ${this.userAnswers[i] || 'لم يتم الإجابة'}
الإجابة الصحيحة: ${q.answer}
${q.explanation ? `الشرح: ${q.explanation}` : ''}
`).join('\n')}
        `;
        
        const blob = new Blob([resultsText], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `نتيجة_الاختبار_${new Date().toISOString().split('T')[0]}.txt`;
        link.click();
    }
}

// Initialize quiz when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.quiz = new InteractiveQuiz();
});