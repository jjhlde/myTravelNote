class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  # Associations
  has_many :travel_plans, dependent: :destroy
  has_many :chat_conversations, dependent: :destroy

  # Validations
  validates :email, presence: true, uniqueness: true
  validates :name, length: { maximum: 100 }, allow_blank: true

  # Scopes
  scope :active, -> { where(active: true) }
  scope :recent, -> { order(created_at: :desc) }

  # Instance methods
  def display_name
    name.presence || email.split('@').first
  end

  def can_create_plan?
    # Check rate limiting
    recent_plans_count < hourly_plan_limit
  end

  def recent_plans_count
    travel_plans.where('created_at > ?', 1.hour.ago).count
  end

  def hourly_plan_limit
    premium? ? 20 : Rails.configuration.x.rate_limits.ai_per_hour
  end

  def premium?
    premium_until.present? && premium_until > Time.current
  end
end