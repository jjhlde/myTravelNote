require_relative "boot"

require "rails/all"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module TravelMaster
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 7.1

    # Please, add to the `ignore` list any other `lib` subdirectories that do
    # not contain `.rb` files, or that should not be reloaded or eager loaded.
    # Common ones are `templates`, `generators`, or `middleware`, for example.
    config.autoload_lib(ignore: %w(assets tasks))

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    config.time_zone = "Asia/Seoul"
    # config.eager_load_paths << Rails.root.join("extras")

    # Don't generate system test files.
    # config.generators.system_tests = nil

    # Active Job configuration
    config.active_job.queue_adapter = :sidekiq

    # Action Cable configuration
    config.action_cable.mount_path = '/cable'

    # Feature flags configuration
    config.feature_flags = config_for(:features) rescue {}

    # Custom configuration for services
    config.x.gemini.model = "gemini-2.5-flash"
    config.x.gemini.max_tokens = 8192
    config.x.gemini.temperature = 0.7

    # Rate limiting configuration
    config.x.rate_limits.per_minute = ENV.fetch("RATE_LIMIT_PER_MINUTE", 100).to_i
    config.x.rate_limits.ai_per_hour = ENV.fetch("RATE_LIMIT_AI_PER_HOUR", 10).to_i

    # PWA generation settings
    config.x.pwa.base_path = Rails.root.join("public", "pwa")
    config.x.pwa.template_path = Rails.root.join("app", "views", "pwa", "templates")

    # Permitted locales
    config.i18n.available_locales = [:ko, :en, :ja, :zh]
    config.i18n.default_locale = :ko

    # CORS configuration for API endpoints
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins '*'
        resource '/api/*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head],
          expose: ['X-Total-Count', 'X-Page', 'X-Per-Page']
      end
    end if defined?(Rack::Cors)
  end
end