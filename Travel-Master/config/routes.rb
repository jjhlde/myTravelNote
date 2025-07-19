Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  root "home#index"

  # Devise routes for authentication
  devise_for :users, controllers: {
    sessions: 'users/sessions',
    registrations: 'users/registrations'
  }

  # Travel Plans
  resources :travel_plans do
    member do
      post :generate
      get :status
      get :pwa_status
    end
    
    resources :days do
      resources :activities
      resources :restaurants
    end
  end

  # Chat interface
  namespace :chat do
    post :message
    get :history
  end

  # PWA routes
  get '/plan/:slug', to: 'pwa#show', as: :pwa_plan
  get '/pwa/:id/manifest.json', to: 'pwa#manifest', as: :pwa_manifest
  get '/pwa/:id/sw.js', to: 'pwa#service_worker', as: :pwa_service_worker
  get '/pwa/:id/offline', to: 'pwa#offline', as: :pwa_offline

  # API endpoints
  namespace :api do
    namespace :v1 do
      # Authentication
      namespace :auth do
        post :login
        post :register
        post :logout
        post :refresh
      end

      # Travel Plans API
      resources :travel_plans, only: [:index, :show, :create, :update, :destroy] do
        member do
          post :generate
          get :status
        end
      end

      # Places proxy API
      namespace :places do
        get :search
        get :details
        get :photos
      end

      # PWA API
      namespace :pwa do
        get ':id/status'
        get ':id/manifest'
      end
    end
  end

  # Admin routes (optional, for future use)
  namespace :admin do
    root to: 'dashboard#index'
    resources :users
    resources :travel_plans
    resources :analytics, only: [:index]
  end

  # Sidekiq Web UI (in production, add authentication)
  require 'sidekiq/web'
  mount Sidekiq::Web => '/sidekiq' if Rails.env.development?

  # Action Cable
  mount ActionCable.server => '/cable'

  # Catch-all route for PWA single-page apps
  get '/plan/*path', to: 'pwa#show'
end