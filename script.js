document.addEventListener('DOMContentLoaded', () => {
    // --- Chatbot Page Logic ---
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        const chatInput = document.getElementById('chat-input');
        const sendButton = document.getElementById('send-button');
        // const ideaButton = document.getElementById('idea-button'); // Removed

        // const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`; // 추후 구현

        // Gemini API 호출 함수 비활성화 (추후 구현)
        // const callGeminiAPI = async (userPrompt, systemPrompt) => { ... };

        // 시스템 프롬프트 로드 함수 비활성화 (추후 구현)
        // const getSystemPrompt = async () => { ... };

        // 로그인 모달 관련 변수 및 함수 비활성화 (추후 구현)
        // const loginModalOverlay = document.getElementById('loginModalOverlay');
        // const closeLoginModalBtn = document.getElementById('closeLoginModal');
        // const googleLoginBtn = document.querySelector('.social-login-btn.google');
        // const showLoginModal = () => { ... };
        // const hideLoginModal = () => { ... };

        // API 호출 함수 비활성화 (추후 구현)
        // const proceedWithApiCall = async (messageText) => { ... };

        const handleSendMessage = async () => {
            const messageText = chatInput.value.trim();
            if (messageText === '') return;

            // 사용자 메시지 출력
            appendMessage('user', messageText);
            chatInput.value = ''; // 입력창 비우기
            
            // AI 생각중 점점점 표시
            setTimeout(() => {
                showThinkingIndicator();
            }, 500);
        };
        
        const showThinkingIndicator = () => {
            const thinkingDiv = document.createElement('div');
            thinkingDiv.classList.add('message', 'bot', 'thinking');
            thinkingDiv.innerHTML = `
                <div class="avatar"><i class="fa-solid fa-plane-departure"></i></div>
                <div class="thinking-dots">
                    <span></span><span></span><span></span>
                </div>
            `;
            thinkingDiv.style.opacity = '0';
            thinkingDiv.style.transform = 'translateY(20px)';
            
            chatMessages.appendChild(thinkingDiv);
            
            setTimeout(() => {
                thinkingDiv.style.transition = 'all 0.3s ease';
                thinkingDiv.style.opacity = '1';
                thinkingDiv.style.transform = 'translateY(0)';
                
                // 2초 후 AI 답변으로 교체
                setTimeout(() => {
                    chatMessages.removeChild(thinkingDiv);
                    showAIResponse();
                }, 2000);
            }, 100);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };
        
        const showAIResponse = () => {
            const responseText = '네, 잠시만 기다려 주세요. 여행 플랜을 금방 만들어드릴게요! 🚀';
            
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', 'bot');
            messageDiv.innerHTML = `<div class="avatar"><i class="fa-solid fa-plane-departure"></i></div><p>${responseText}</p>`;
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(20px)';
            
            chatMessages.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.style.transition = 'all 0.4s ease';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0)';
                
                // 1초 후 버튼 표시
                setTimeout(() => {
                    showAppCreateButton();
                }, 1000);
            }, 100);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };
        
        const showAppCreateButton = () => {
            // 독립적인 액션 버튼 영역 생성
            const actionButtonContainer = document.createElement('div');
            actionButtonContainer.classList.add('action-button-container');
            actionButtonContainer.innerHTML = `
                <button class="create-app-btn" onclick="startAppCreation()">
                    <div class="btn-content">
                        <div class="btn-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" fill="currentColor"/>
                                <path d="M19 15L20.09 18.26L23 19L20.09 19.74L19 23L17.91 19.74L15 19L17.91 18.26L19 15Z" fill="currentColor"/>
                                <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" fill="currentColor"/>
                            </svg>
                        </div>
                        <div class="btn-text">
                            <div class="btn-title">나만의 여행앱 만들기</div>
                            <div class="btn-subtitle">AI가 맞춤 여행 앱을 제작해드려요</div>
                        </div>
                        <div class="btn-arrow">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </button>
            `;
            
            actionButtonContainer.style.opacity = '0';
            actionButtonContainer.style.transform = 'translateY(30px)';
            actionButtonContainer.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            chatMessages.appendChild(actionButtonContainer);
            
            setTimeout(() => {
                actionButtonContainer.style.opacity = '1';
                actionButtonContainer.style.transform = 'translateY(0)';
            }, 200);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };
        
        // 전역 함수로 등록
        window.startAppCreation = () => {
            // 로딩 화면 표시
            showLoadingScreen();
        };
        
        const showLoadingScreen = () => {
            const loadingDiv = document.createElement('div');
            loadingDiv.classList.add('message', 'bot', 'loading-message');
            loadingDiv.innerHTML = `
                <div class="avatar"><i class="fa-solid fa-plane-departure"></i></div>
                <div class="loading-content">
                    <div class="loading-spinner"></div>
                    <p>여행 앱을 제작 중입니다...</p>
                </div>
            `;
            loadingDiv.style.opacity = '0';
            loadingDiv.style.transform = 'translateY(20px)';
            
            chatMessages.appendChild(loadingDiv);
            
            setTimeout(() => {
                loadingDiv.style.transition = 'all 0.4s ease';
                loadingDiv.style.opacity = '1';
                loadingDiv.style.transform = 'translateY(0)';
                
                // 3초 후 완료 메시지
                setTimeout(() => {
                    chatMessages.removeChild(loadingDiv);
                    showFinalMessage();
                }, 3000);
            }, 100);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };
        
        const showFinalMessage = () => {
            const finalText = '이제 다 됐어요! 여행앱을 확인해보세요! 🎉';
            
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', 'bot');
            messageDiv.innerHTML = `<div class="avatar"><i class="fa-solid fa-plane-departure"></i></div><p>${finalText}</p>`;
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(20px)';
            
            chatMessages.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.style.transition = 'all 0.4s ease';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0)';
                
                // 1초 후 앱 확인 버튼 표시
                setTimeout(() => {
                    showAppCheckButton();
                }, 1000);
            }, 100);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };
        
        const showAppCheckButton = () => {
            // 성취 카드 영역 생성
            const actionButtonContainer = document.createElement('div');
            actionButtonContainer.classList.add('action-button-container');
            actionButtonContainer.innerHTML = `
                <div class="achievement-card" onclick="checkTravelApp()">
                    <div class="achievement-glow"></div>
                    <div class="achievement-content">
                        <div class="achievement-icon">
                            <i class="fa-solid fa-trophy"></i>
                        </div>
                        <div class="achievement-text">
                            <div class="achievement-title">맞춤 여행앱 준비 완료!</div>
                            <div class="achievement-subtitle">나의 여행앱 보기</div>
                        </div>
                        <div class="achievement-arrow">
                            <i class="fa-solid fa-chevron-right"></i>
                        </div>
                    </div>
                </div>
            `;
            
            actionButtonContainer.style.opacity = '0';
            actionButtonContainer.style.transform = 'translateY(30px)';
            actionButtonContainer.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            
            chatMessages.appendChild(actionButtonContainer);
            
            setTimeout(() => {
                actionButtonContainer.style.opacity = '1';
                actionButtonContainer.style.transform = 'translateY(0)';
            }, 200);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };
        
        // 전역 함수로 등록
        window.checkTravelApp = () => {
            window.location.href = 'main.html';
        };

        // 로그인 모달 관련 코드 제거
        // const handleLoginChoice = (e) => { ... }
        // closeLoginModalBtn.addEventListener('click', hideLoginModal);
        // googleLoginBtn.addEventListener('click', handleLoginChoice);

        // handleGetIdea function removed - functionality moved to send button

        // 기존 appendMessage 함수 제거 (하단에 새로운 함수로 대체)
        
        // 타이핑 애니메이션은 제거하고 부드러운 등장으로 변경
        
        const startInputSequence = () => {
            const userExamples = [
                "마카오 3박 4일 애기랑 같이 여행갈거야!"
            ];
            
            const randomExample = userExamples[Math.floor(Math.random() * userExamples.length)];
            
            // 입력창에 텍스트 타이핑 애니메이션
            typeIntoInput(randomExample);
        };
        
        const typeIntoInput = (text, speed = 60) => {
            let i = 0;
            chatInput.value = '';
            
            // readonly를 임시로 해제하여 타이핑 효과 구현
            chatInput.removeAttribute('readonly');
            chatInput.focus();
            
            const inputTypeInterval = setInterval(() => {
                chatInput.value += text.charAt(i);
                i++;
                
                if (i >= text.length) {
                    clearInterval(inputTypeInterval);
                    // 타이핑 완료 후 다시 readonly 설정
                    chatInput.setAttribute('readonly', true);
                    chatInput.blur(); // 포커스 해제
                    
                    // 입력 완료 후 전송 버튼 클릭 효과
                    setTimeout(() => {
                        animateSendButton();
                    }, 400);
                }
            }, speed);
        };
        
        const animateSendButton = () => {
            // 버튼 클릭 애니메이션 (효과적이고 감각적인 피드백)
            sendButton.style.transform = 'scale(0.85) rotate(-5deg)';
            sendButton.style.background = '#ff5252';
            sendButton.style.boxShadow = '0 0 20px rgba(255, 107, 107, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.2)';
            
            // 전송 이펙트 만들기
            const ripple = document.createElement('div');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.6)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            ripple.style.left = '50%';
            ripple.style.top = '50%';
            ripple.style.width = '20px';
            ripple.style.height = '20px';
            ripple.style.marginLeft = '-10px';
            ripple.style.marginTop = '-10px';
            ripple.style.pointerEvents = 'none';
            
            sendButton.style.position = 'relative';
            sendButton.appendChild(ripple);
            
            setTimeout(() => {
                sendButton.style.transform = 'scale(1.1) rotate(5deg)';
                sendButton.style.background = 'linear-gradient(135deg, #F57C00, #FFA726)';
                sendButton.style.boxShadow = '0 6px 20px rgba(245, 124, 0, 0.4)';
                
                // 최종 상태로 복귀
                setTimeout(() => {
                    sendButton.style.transform = '';
                    sendButton.style.background = '';
                    sendButton.style.boxShadow = '';
                }, 200);
                
                // 리플 제거
                setTimeout(() => {
                    if (ripple.parentNode) {
                        ripple.parentNode.removeChild(ripple);
                    }
                }, 300);
                
                // 데모용 사용자 메시지 출력
                setTimeout(() => {
                    addUserExampleMessage();
                    // 자동으로 다음 단계 진행
                    setTimeout(() => {
                        chatInput.value = ''; // 입력창 비우기
                        showThinkingIndicator();
                    }, 1000);
                }, 100);
            }, 150);
        };
        
        const addUserExampleMessage = () => {
            // 현재 입력창의 텍스트를 사용자 메시지로 출력
            const messageText = chatInput.value.trim();
            
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', 'user', 'example-message');
            messageDiv.innerHTML = `<div class="avatar"><i class="fa-solid fa-user"></i></div><p>${messageText}</p>`;
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateX(50px) scale(0.8)';
            
            chatMessages.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateX(0) scale(1)';
                
                // 메시지 등장 시 아바타 펄스 효과
                const avatar = messageDiv.querySelector('.avatar');
                avatar.style.animation = 'avatar-pulse 0.8s ease-out';
            }, 100);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };

        // 이전 appendMessage 함수를 간단한 메시지 추가 함수로 변경
        const appendMessage = (sender, text) => {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', sender);
            const icon = sender === 'bot' ? 'fa-plane-departure' : 'fa-user';
            messageDiv.innerHTML = `<div class="avatar"><i class="fa-solid ${icon}"></i></div><p>${text}</p>`;
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(20px)';
            chatMessages.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.style.transition = 'all 0.4s ease-out';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0)';
            }, 100);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };

        // 입력 비활성화 - 자동 대화 시퀀스만 진행
        // sendButton.addEventListener('click', handleSendMessage);
        // chatInput.addEventListener('keydown', (event) => {
        //     if (event.key === 'Enter') {
        //         handleSendMessage();
        //     }
        // });
        
        // 비활성화된 상태에서 클릭 시 안내 메시지 (선택사항)
        sendButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });
        
        chatInput.addEventListener('keydown', (e) => {
            e.preventDefault();
        });
        
        // 페이지 로드 시 빈 화면에서 시작해서 동적으로 대화 생성
        const startConversation = () => {
            // 1초 후 AI 메시지 등장 (더 빠르게)
            setTimeout(() => {
                addAIMessageWithAnimation('어디로 여행 가시나요? 🌍');
            }, 1000);
        };
        
        // AI 메시지를 사용자 애니메이션처럼 추가
        const addAIMessageWithAnimation = (text) => {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', 'bot');
            messageDiv.innerHTML = `<div class="avatar"><i class="fa-solid fa-plane-departure"></i></div><p>${text}</p>`;
            messageDiv.style.opacity = '0';
            messageDiv.style.transform = 'translateY(20px) scale(0.95)';
            
            chatMessages.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.style.transition = 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                messageDiv.style.opacity = '1';
                messageDiv.style.transform = 'translateY(0) scale(1)';
                
                // AI 메시지 완료 후 0.5초 후 입력 시퀀스 시작
                setTimeout(() => {
                    startInputSequence();
                }, 500);
            }, 100);
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
        };
        
        // 페이지 로드 후 대화 시작
        startConversation();
    }

    // --- Main Page (main.html) Logic ---
    const pagesWrapper = document.getElementById('pagesWrapper');
    if (pagesWrapper) {
        const installGuideOverlay = document.getElementById('installGuideOverlay');
        const closeGuideBtn = document.getElementById('closeGuideBtn');
        const installNowBtn = document.getElementById('installNowBtn');
        const skipInstallBtn = document.getElementById('skipInstallBtn');

        if (installGuideOverlay) {
            const hasSeenInstallGuide = localStorage.getItem('macau-install-guide-seen');
            const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            const isInStandaloneMode = window.navigator.standalone === true;

            if (!isInStandaloneMode && !hasSeenInstallGuide) {
                setTimeout(() => {
                    installGuideOverlay.classList.add('show');
                }, 1000);
            }

            closeGuideBtn.addEventListener('click', () => hideInstallGuide());
            skipInstallBtn.addEventListener('click', () => hideInstallGuide());

            installNowBtn.addEventListener('click', () => {
                hideInstallGuide();
                if (isIOS) {
                    alert('📱 하단의 공유 버튼을 눌러 "홈 화면에 추가"를 선택해주세요!');
                } else {
                    alert('📱 브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치"를 선택해주세요!');
                }
            });

            installGuideOverlay.addEventListener('click', (e) => {
                if (e.target === installGuideOverlay) {
                    hideInstallGuide();
                }
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && installGuideOverlay.classList.contains('show')) {
                    hideInstallGuide();
                }
            });

            function hideInstallGuide() {
                installGuideOverlay.classList.remove('show');
                localStorage.setItem('macau-install-guide-seen', 'true');
            }

            let deferredPrompt;
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                deferredPrompt = e;
            });

            if (!isIOS) {
                installNowBtn.addEventListener('click', async () => {
                    if (deferredPrompt) {
                        hideInstallGuide();
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        deferredPrompt = null;
                    }
                });
            }
        }

        const dayTabs = document.querySelectorAll('.day-tab');
        const indicatorDots = document.querySelectorAll('.indicator-dot');
        const swipeHint = document.getElementById('swipeHint');
        
        const pageNames = ['info', 'day1', 'day2', 'day3', 'day4', 'budget'];
        let currentPage = 0;
        const totalPages = 6;

        const pageFiles = [
            'pages/info.html',
            'pages/day1.html',
            'pages/day2.html',
            'pages/day3.html',
            'pages/day4.html',
            'pages/budget.html'
        ];

        const loadedPages = new Set();

        async function loadPageContent(pageIndex) {
            if (loadedPages.has(pageIndex)) return;

            const pageElement = document.getElementById(`page-${pageIndex}`);
            if (!pageElement) return;

            try {
                const response = await fetch(pageFiles[pageIndex]);
                if (response.ok) {
                    const content = await response.text();
                    pageElement.innerHTML = content;
                    loadedPages.add(pageIndex);
                    initAllSliders();
                    initImagePopup();
                    initLocationButtons();
                } else {
                    pageElement.innerHTML = '<div class="error">페이지를 불러올 수 없습니다.</div>';
                }
            } catch (error) {
                pageElement.innerHTML = '<div class="error">페이지 로딩 중 오류가 발생했습니다.</div>';
            }
        }

        async function preloadAdjacentPages(pageIndex) {
            await loadPageContent(pageIndex);
            if (pageIndex > 0) {
                loadPageContent(pageIndex - 1);
            }
            if (pageIndex < pageFiles.length - 1) {
                loadPageContent(pageIndex + 1);
            }
        }

        async function updatePage(pageIndex) {
            currentPage = Math.max(0, Math.min(5, pageIndex));
            const translateX = -currentPage * (100 / 6);
            pagesWrapper.style.transform = `translateX(${translateX}%)`;
            
            dayTabs.forEach((tab, index) => {
                tab.classList.toggle('active', index === currentPage);
            });
            
            indicatorDots.forEach((dot, index) => {
                dot.classList.toggle('active', index === currentPage);
            });

            await preloadAdjacentPages(currentPage);
        }

        updatePage(0);

        dayTabs.forEach((tab, index) => {
            tab.addEventListener('click', () => updatePage(index));
        });

        indicatorDots.forEach((dot, index) => {
            dot.addEventListener('click', () => updatePage(index));
        });

        let startX, startY, currentX, isDragging, isHorizontalSwipe;
        pagesWrapper.addEventListener('touchstart', (e) => {
            if (e.target.closest('.place-images')) return;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = false;
            isHorizontalSwipe = false;
        });

        pagesWrapper.addEventListener('touchmove', (e) => {
            if (e.target.closest('.place-images')) return;
            if (isDragging) {
                currentX = e.touches[0].clientX;
                e.preventDefault();
                return;
            }
            const currentY = e.touches[0].clientY;
            currentX = e.touches[0].clientX;
            const deltaX = Math.abs(startX - currentX);
            const deltaY = Math.abs(startY - currentY);
            if (deltaX > deltaY && deltaX > 10) {
                isHorizontalSwipe = true;
                isDragging = true;
                e.preventDefault();
            }
        });

        pagesWrapper.addEventListener('touchend', (e) => {
            if (e.target.closest('.place-images')) return;
            if (!isDragging || !isHorizontalSwipe) return;
            isDragging = false;
            isHorizontalSwipe = false;
            const deltaX = startX - currentX;
            const threshold = 50;
            if (Math.abs(deltaX) > threshold) {
                if (deltaX > 0 && currentPage < 5) {
                    updatePage(currentPage + 1);
                } else if (deltaX < 0 && currentPage > 0) {
                    updatePage(currentPage - 1);
                }
            }
        });

        let startMouseY = 0;
        let isMouseHorizontalDrag = false;
        pagesWrapper.addEventListener('mousedown', (e) => {
            startX = e.clientX;
            startMouseY = e.clientY;
            isDragging = false;
            isMouseHorizontalDrag = false;
            pagesWrapper.style.cursor = 'grabbing';
        });

        pagesWrapper.addEventListener('mousemove', (e) => {
            if (isDragging && isMouseHorizontalDrag) {
                currentX = e.clientX;
                return;
            }
            if (!isDragging && !isMouseHorizontalDrag) {
                const deltaX = Math.abs(startX - e.clientX);
                const deltaY = Math.abs(startMouseY - e.clientY);
                if (deltaX > deltaY && deltaX > 10) {
                    isMouseHorizontalDrag = true;
                    isDragging = true;
                    currentX = e.clientX;
                }
            }
        });

        pagesWrapper.addEventListener('mouseup', () => {
            if (!isDragging || !isMouseHorizontalDrag) {
                pagesWrapper.style.cursor = 'grab';
                return;
            }
            isDragging = false;
            isMouseHorizontalDrag = false;
            pagesWrapper.style.cursor = 'grab';
            const deltaX = startX - currentX;
            const threshold = 50;
            if (Math.abs(deltaX) > threshold) {
                if (deltaX > 0 && currentPage < 5) {
                    updatePage(currentPage + 1);
                } else if (deltaX < 0 && currentPage > 0) {
                    updatePage(currentPage - 1);
                }
            }
        });

        pagesWrapper.addEventListener('mouseleave', () => {
            isDragging = false;
            pagesWrapper.style.cursor = 'grab';
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && currentPage > 0) {
                updatePage(currentPage - 1);
            } else if (e.key === 'ArrowRight' && currentPage < 5) {
                updatePage(currentPage + 1);
            }
        });

        if (swipeHint) {
            setTimeout(() => {
                swipeHint.classList.add('show');
                setTimeout(() => {
                    swipeHint.classList.remove('show');
                }, 3000);
            }, 2000);
        }

        if ('caches' in window) {
            window.addEventListener('load', () => {
                caches.open('macau-travel-v1').then(cache => {
                    cache.add(window.location.href);
                    pageFiles.forEach(file => cache.add(file));
                }).catch(err => {});
            });
        }

        let sliderStates = {};

        function initSlider(sliderId) {
            if (!sliderStates[sliderId]) {
                sliderStates[sliderId] = {
                    currentSlide: 0,
                    totalSlides: document.querySelectorAll(`#${sliderId} .place-images-slider img`).length
                };
            }
        }

        function showSlide(sliderId, slideIndex) {
            initSlider(sliderId);
            const slider = document.getElementById(sliderId);
            if (!slider) return;
            const sliderTrack = slider.querySelector('.place-images-slider');
            const dots = slider.querySelectorAll('.place-images-dot');
            const counter = slider.querySelector('.place-images-counter');
            const totalSlides = sliderStates[sliderId].totalSlides;
            slideIndex = Math.max(0, Math.min(slideIndex, totalSlides - 1));
            sliderStates[sliderId].currentSlide = slideIndex;
            sliderTrack.style.transform = `translateX(-${slideIndex * 100}%)`;
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === slideIndex);
            });
            if (counter) {
                counter.textContent = `${slideIndex + 1}/${totalSlides}`;
            }
        }

        window.nextSlide = nextSlide;
        window.prevSlide = prevSlide;
        window.showSlide = showSlide;

        function nextSlide(sliderId) {
            initSlider(sliderId);
            const { currentSlide, totalSlides } = sliderStates[sliderId];
            const next = currentSlide + 1 >= totalSlides ? 0 : currentSlide + 1;
            showSlide(sliderId, next);
        }

        function prevSlide(sliderId) {
            initSlider(sliderId);
            const { currentSlide, totalSlides } = sliderStates[sliderId];
            const prev = currentSlide - 1 < 0 ? totalSlides - 1 : currentSlide - 1;
            showSlide(sliderId, prev);
        }

        function initAllSliders() {
            const sliders = document.querySelectorAll('.place-images');
            sliders.forEach(slider => {
                if (slider.id) {
                    initSlider(slider.id);
                    showSlide(slider.id, 0);
                }
            });
        }

        function initImagePopup() {
            const images = document.querySelectorAll('.place-images-slider img');
            images.forEach(img => {
                img.removeEventListener('click', handleImageClick);
                img.addEventListener('click', handleImageClick);
            });
        }

        function handleImageClick(e) {
            const img = e.target;
            const popupOverlay = document.getElementById('imagePopupOverlay');
            const popupImg = document.getElementById('popupImage');
            const popupTitle = document.getElementById('popupTitle');
            const popupDescription = document.getElementById('popupDescription');
            if (popupOverlay && popupImg) {
                popupImg.src = img.src;
                popupImg.alt = img.alt;
                if (popupTitle) popupTitle.textContent = img.alt || '여행 사진';
                if (popupDescription) popupDescription.textContent = '클릭하거나 ESC 키를 눌러 닫기';
                popupOverlay.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        }

        function closeImagePopup() {
            const popupOverlay = document.getElementById('imagePopupOverlay');
            if (popupOverlay) {
                popupOverlay.classList.remove('show');
                document.body.style.overflow = '';
            }
        }

        const popupOverlay = document.getElementById('imagePopupOverlay');
        const popupClose = document.getElementById('popupClose');
        if (popupClose) {
            popupClose.addEventListener('click', closeImagePopup);
        }
        if (popupOverlay) {
            popupOverlay.addEventListener('click', (e) => {
                if (e.target === popupOverlay) {
                    closeImagePopup();
                }
            });
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeImagePopup();
            }
        });

        function openGoogleMaps(query) {
            const encodedQuery = encodeURIComponent(query);
            const googleMapsUrl = `https://www.google.com/maps/search/${encodedQuery}`;
            window.open(googleMapsUrl, '_blank');
        }

        function initLocationButtons() {
            const locationButtons = document.querySelectorAll('.map-btn');
            locationButtons.forEach(btn => {
                const originalHref = btn.getAttribute('href');
                if (originalHref && originalHref.includes('maps.google.com')) {
                    btn.removeAttribute('href');
                    btn.style.cursor = 'pointer';
                    const coordMatch = originalHref.match(/q=([^&]+)/);
                    if (coordMatch) {
                        const coords = coordMatch[1];
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            openGoogleMaps(coords);
                        });
                    }
                }
                const locationText = btn.textContent.trim().replace('📍', '').trim();
                if (locationText && !btn.hasAttribute('href')) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        openGoogleMaps(locationText + ' 마카오');
                    });
                }
            });
        }
    }
});