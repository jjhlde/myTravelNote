class Day < ApplicationRecord
  # Associations
  belongs_to :travel_plan
  has_many :activities, dependent: :destroy
  has_many :restaurants, dependent: :destroy

  # Validations
  validates :date, presence: true
  validates :day_number, presence: true, numericality: { greater_than: 0 }
  validates :theme, length: { maximum: 200 }

  # Callbacks
  before_validation :set_day_number, on: :create

  # Scopes
  default_scope { order(:day_number) }
  scope :with_activities, -> { includes(:activities, :restaurants) }

  # Instance methods
  def formatted_date
    date&.strftime("%Y년 %m월 %d일")
  end

  def day_of_week
    date&.strftime("%A")
  end

  def total_estimated_cost
    activities.sum(:estimated_cost) + restaurants.sum { |r| r.average_price || 0 }
  end

  def morning_activities
    activities.where("time_slot LIKE ?", "%오전%").or(
      activities.where("time_slot ~ ?", '^(0[0-9]|1[0-1]):')
    )
  end

  def afternoon_activities
    activities.where("time_slot LIKE ?", "%오후%").or(
      activities.where("time_slot ~ ?", '^(1[2-7]):')
    ).where.not(id: morning_activities.select(:id))
  end

  def evening_activities
    activities.where("time_slot LIKE ?", "%저녁%").or(
      activities.where("time_slot ~ ?", '^(1[8-9]|2[0-3]):')
    )
  end

  private

  def set_day_number
    return if day_number.present?
    return unless travel_plan && date

    self.day_number = (date - travel_plan.start_date).to_i + 1
  end
end