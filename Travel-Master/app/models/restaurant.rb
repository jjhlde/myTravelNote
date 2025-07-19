class Restaurant < ApplicationRecord
  # Associations
  belongs_to :day
  has_one :travel_plan, through: :day

  # Validations
  validates :name, presence: true, length: { maximum: 200 }
  validates :meal_type, presence: true, inclusion: { 
    in: %w[breakfast brunch lunch dinner snack dessert] 
  }
  validates :price_range, inclusion: { in: %w[$ $$ $$$ $$$$] }, allow_blank: true

  # JSONB accessors
  store_accessor :location_data, :address, :coordinates, :place_id, :photo_urls
  store_accessor :metadata, :rating, :review_count, :opening_hours, :phone, :website

  # Scopes
  scope :by_meal_type, ->(type) { where(meal_type: type) }
  scope :by_price_range, ->(range) { where(price_range: range) }
  scope :highly_rated, -> { where("metadata->>'rating' >= '4.0'") }

  # Callbacks
  after_create_commit :fetch_restaurant_details

  # Instance methods
  def formatted_meal_type
    I18n.t("meal_types.#{meal_type}", default: meal_type.humanize)
  end

  def average_price
    case price_range
    when '$' then 10_000
    when '$$' then 20_000
    when '$$$' then 40_000
    when '$$$$' then 60_000
    else 15_000
    end
  end

  def rating
    metadata['rating']&.to_f
  end

  def review_count
    metadata['review_count']&.to_i
  end

  def has_good_rating?
    rating.present? && rating >= 4.0
  end

  def opening_hours_today
    return nil unless metadata['opening_hours'].present?
    
    day_of_week = Date.today.strftime("%A").downcase
    metadata['opening_hours'][day_of_week]
  end

  def google_maps_url
    return super if super.present?
    return nil unless coordinates.present?

    lat = coordinates['lat'] || coordinates[:lat]
    lng = coordinates['lng'] || coordinates[:lng]
    
    "https://maps.google.com/?q=#{lat},#{lng}" if lat && lng
  end

  def recommended_dishes_list
    return [] unless recommended_dishes.present?
    recommended_dishes.split(/[,，、]/).map(&:strip)
  end

  private

  def fetch_restaurant_details
    return unless name.present?
    RestaurantInfoEnhancementJob.perform_later(self)
  end
end