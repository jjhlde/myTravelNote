class TravelPlannerService < BaseService
  def initialize(travel_plan, ai_provider: nil)
    @travel_plan = travel_plan
    @ai_provider = ai_provider || GeminiService.new
  end

  def call
    with_error_handling do
      log_info "Starting travel plan generation for plan ##{@travel_plan.id}"
      
      # Generate AI response
      ai_result = generate_ai_plan
      return ai_result unless ai_result.success?

      # Parse and save the plan
      parse_result = parse_and_save_plan(ai_result.data[:travel_plan])
      return parse_result unless parse_result.success?

      # Generate PWA
      generate_pwa

      # Mark as published
      @travel_plan.update!(status: 'published')
      
      log_info "Successfully generated travel plan ##{@travel_plan.id}"
      success(travel_plan: @travel_plan.reload)
    end
  end

  private

  def generate_ai_plan
    context = {
      travelers_count: @travel_plan.travelers_count,
      budget: @travel_plan.budget_range,
      preferences: @travel_plan.preferences,
      start_date: @travel_plan.start_date,
      end_date: @travel_plan.end_date
    }

    @ai_provider.generate_travel_plan(@travel_plan.user_input, context)
  end

  def parse_and_save_plan(plan_data)
    ActiveRecord::Base.transaction do
      # Update travel plan with AI response
      @travel_plan.update!(
        title: plan_data['title'],
        destination: plan_data['destination'],
        ai_response: {
          raw_response: plan_data,
          parsed_data: plan_data,
          metadata: {
            generated_at: Time.current,
            model: Rails.configuration.x.gemini.model
          }
        }
      )

      # Create days and activities
      plan_data['days'].each do |day_data|
        create_day_with_activities(day_data)
      end

      success()
    end
  rescue ActiveRecord::RecordInvalid => e
    failure("Failed to save travel plan: #{e.message}")
  end

  def create_day_with_activities(day_data)
    day = @travel_plan.days.create!(
      date: parse_date(day_data['date']),
      day_number: day_data['day'],
      theme: day_data['theme'],
      metadata: {
        accommodation: day_data['accommodation'],
        weather_forecast: day_data['weather']
      }
    )

    # Create activities
    Array(day_data['activities']).each do |activity_data|
      create_activity(day, activity_data)
    end

    # Create restaurants
    Array(day_data['restaurants']).each do |restaurant_data|
      create_restaurant(day, restaurant_data)
    end
  end

  def create_activity(day, activity_data)
    day.activities.create!(
      time_slot: activity_data['time'],
      title: activity_data['title'],
      description: activity_data['description'],
      location_name: activity_data['location'],
      estimated_cost: activity_data['estimated_cost'] || 0,
      activity_type: determine_activity_type(activity_data),
      location_data: {
        address: activity_data['address'],
        coordinates: extract_coordinates(activity_data)
      },
      metadata: {
        tips: activity_data['tips'],
        child_friendly: activity_data['child_friendly'],
        duration_minutes: extract_duration(activity_data['time']),
        booking_required: activity_data['booking_required']
      }
    )
  end

  def create_restaurant(day, restaurant_data)
    day.restaurants.create!(
      meal_type: restaurant_data['meal_type'],
      name: restaurant_data['name'],
      cuisine_type: restaurant_data['cuisine'],
      price_range: restaurant_data['price_range'],
      recommended_dishes: restaurant_data['recommended_dishes'],
      location_data: {
        address: restaurant_data['address'],
        location: restaurant_data['location']
      },
      metadata: {
        reservation_required: restaurant_data['reservation_required'],
        child_friendly: restaurant_data['child_friendly']
      }
    )
  end

  def generate_pwa
    PwaGenerationJob.perform_later(@travel_plan)
  end

  def parse_date(date_string)
    return @travel_plan.start_date if date_string.blank?
    
    Date.parse(date_string)
  rescue Date::Error
    @travel_plan.start_date
  end

  def determine_activity_type(activity_data)
    title = activity_data['title'].to_s.downcase
    
    case title
    when /쇼핑|shop|mall|시장/
      'shopping'
    when /식사|레스토랑|카페|음식/
      'dining'
    when /이동|교통|버스|지하철|택시/
      'transport'
    when /휴식|rest|break/
      'rest'
    when /공연|show|엔터테인먼트/
      'entertainment'
    when /박물관|미술관|사찰|문화/
      'cultural'
    else
      'sightseeing'
    end
  end

  def extract_coordinates(activity_data)
    return nil unless activity_data['coordinates'] || activity_data['lat']

    {
      lat: activity_data['coordinates']&.[]('lat') || activity_data['lat'],
      lng: activity_data['coordinates']&.[]('lng') || activity_data['lng']
    }
  end

  def extract_duration(time_slot)
    return nil unless time_slot.present?

    match = time_slot.match(/(\d+):(\d+)\s*-\s*(\d+):(\d+)/)
    return nil unless match

    start_hour, start_min, end_hour, end_min = match[1..4].map(&:to_i)
    ((end_hour * 60 + end_min) - (start_hour * 60 + start_min))
  end
end