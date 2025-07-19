class Activity < ApplicationRecord
  # Associations
  belongs_to :day
  has_one :travel_plan, through: :day

  # Validations
  validates :title, presence: true, length: { maximum: 200 }
  validates :time_slot, presence: true
  validates :activity_type, inclusion: { 
    in: %w[sightseeing shopping dining transport rest entertainment cultural] 
  }, allow_blank: true

  # JSONB accessors
  store_accessor :location_data, :address, :coordinates, :place_id, :photo_urls
  store_accessor :metadata, :duration_minutes, :booking_required, :child_friendly, :tips

  # Scopes
  default_scope { order(:time_slot) }
  scope :for_type, ->(type) { where(activity_type: type) }
  scope :child_friendly, -> { where("metadata->>'child_friendly' = 'true'") }

  # Callbacks
  after_create_commit :fetch_additional_info
  after_update_commit :update_total_cost

  # Instance methods
  def formatted_time_slot
    time_slot.presence || "시간 미정"
  end

  def google_maps_url
    return super if super.present?
    return nil unless coordinates.present?

    lat = coordinates['lat'] || coordinates[:lat]
    lng = coordinates['lng'] || coordinates[:lng]
    
    "https://maps.google.com/?q=#{lat},#{lng}" if lat && lng
  end

  def has_location?
    coordinates.present? || google_maps_url.present?
  end

  def duration_in_hours
    return nil unless metadata['duration_minutes'].present?
    (metadata['duration_minutes'].to_f / 60).round(1)
  end

  def requires_booking?
    metadata['booking_required'] == true || 
    metadata['booking_required'] == 'true'
  end

  def child_friendly?
    metadata['child_friendly'] == true || 
    metadata['child_friendly'] == 'true'
  end

  private

  def fetch_additional_info
    return unless location_name.present? || coordinates.present?
    PlaceInfoEnhancementJob.perform_later(self)
  end

  def update_total_cost
    return unless saved_change_to_estimated_cost?
    
    travel_plan.touch if travel_plan.present?
  end
end