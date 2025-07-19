class TravelPlan < ApplicationRecord
  # Associations
  belongs_to :user
  has_many :days, dependent: :destroy
  has_many :activities, through: :days
  has_many :restaurants, through: :days

  # Validations
  validates :title, presence: true, length: { maximum: 200 }
  validates :destination, presence: true
  validates :start_date, presence: true
  validates :end_date, presence: true
  validates :unique_slug, presence: true, uniqueness: true
  validates :status, inclusion: { in: %w[draft generating published archived] }

  # Callbacks
  before_validation :generate_unique_slug, on: :create
  after_create_commit :trigger_plan_created_event
  after_update_commit :broadcast_updates

  # Scopes
  scope :published, -> { where(status: 'published') }
  scope :recent, -> { order(created_at: :desc) }
  scope :for_destination, ->(destination) { where('destination ILIKE ?', "%#{destination}%") }

  # JSONB accessors
  store_accessor :ai_response, :raw_response, :parsed_data, :metadata
  store_accessor :preferences, :budget_range, :travel_style, :interests

  # Instance methods
  def duration_in_days
    return 0 unless start_date && end_date
    (end_date - start_date).to_i + 1
  end

  def pwa_url
    "/plan/#{unique_slug}"
  end

  def pwa_ready?
    status == 'published' && pwa_generated_at.present?
  end

  def generate_pwa!
    PwaGenerationJob.perform_later(self)
  end

  def to_param
    unique_slug
  end

  # Class methods
  class << self
    def generate_from_input(user, input, preferences = {})
      plan = create!(
        user: user,
        title: "여행 계획 생성 중...",
        destination: extract_destination(input),
        start_date: Date.today + 1.week,
        end_date: Date.today + 1.week + 3.days,
        status: 'generating',
        user_input: input,
        preferences: preferences
      )

      TravelPlanGenerationJob.perform_later(plan)
      plan
    end

    private

    def extract_destination(input)
      # Simple extraction logic - can be enhanced with NLP
      input.split.find { |word| word.length > 3 } || "여행지"
    end
  end

  private

  def generate_unique_slug
    self.unique_slug = loop do
      slug = SecureRandom.alphanumeric(8).downcase
      break slug unless self.class.exists?(unique_slug: slug)
    end
  end

  def trigger_plan_created_event
    Rails.configuration.event_bus&.publish(
      'travel_plan.created',
      plan_id: id,
      user_id: user_id
    )
  end

  def broadcast_updates
    TravelPlanChannel.broadcast_to(
      self,
      {
        type: 'update',
        plan: as_json(include: [:days, :activities, :restaurants])
      }
    )
  end
end