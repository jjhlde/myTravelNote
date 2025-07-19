require 'net/http'
require 'json'

class GeminiService < BaseService
  API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent"

  def initialize(api_key: nil)
    @api_key = api_key || Rails.application.credentials.dig(:gemini, :api_key) || ENV['GEMINI_API_KEY']
    @model = Rails.configuration.x.gemini.model
    @max_tokens = Rails.configuration.x.gemini.max_tokens
    @temperature = Rails.configuration.x.gemini.temperature
  end

  def generate(prompt, options = {})
    with_error_handling do
      validate_api_key!
      
      response = make_request(prompt, options)
      
      if response.code.to_i == 200
        parse_response(response.body)
      else
        handle_error_response(response)
      end
    end
  end

  def generate_travel_plan(user_input, context = {})
    prompt = build_travel_plan_prompt(user_input, context)
    
    result = generate(prompt, {
      temperature: 0.7,
      response_format: 'json'
    })

    if result.success?
      parse_travel_plan_response(result.data)
    else
      result
    end
  end

  private

  def validate_api_key!
    raise ArgumentError, "Gemini API key is not configured" if @api_key.blank?
  end

  def make_request(prompt, options = {})
    uri = URI("#{API_URL}?key=#{@api_key}")
    
    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    
    request.body = build_request_body(prompt, options).to_json

    Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end
  end

  def build_request_body(prompt, options = {})
    {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: options[:temperature] || @temperature,
        maxOutputTokens: options[:max_tokens] || @max_tokens,
        topP: options[:top_p] || 0.95,
        topK: options[:top_k] || 40
      }
    }
  end

  def parse_response(body)
    data = JSON.parse(body)
    
    if data['candidates']&.first&.dig('content', 'parts')&.first&.[]('text')
      text = data['candidates'].first['content']['parts'].first['text']
      success(content: text, raw_response: data)
    else
      failure("No valid response from Gemini API")
    end
  rescue JSON::ParserError => e
    failure("Failed to parse API response: #{e.message}")
  end

  def handle_error_response(response)
    error_data = JSON.parse(response.body) rescue {}
    error_message = error_data.dig('error', 'message') || "API request failed with status #{response.code}"
    
    log_error("Gemini API error: #{error_message}", nil)
    failure(error_message)
  end

  def build_travel_plan_prompt(user_input, context)
    <<~PROMPT
      당신은 20년 경력의 전문 여행 플래너입니다. 사용자의 요청에 따라 상세한 여행 계획을 JSON 형식으로 생성해주세요.

      사용자 요청: #{user_input}

      추가 정보:
      - 여행자 수: #{context[:travelers_count] || '정보 없음'}
      - 예산: #{context[:budget] || '정보 없음'}
      - 선호사항: #{context[:preferences]&.to_json || '정보 없음'}

      다음 JSON 구조로 응답해주세요:
      {
        "title": "여행 제목",
        "destination": "목적지",
        "duration": "X박 Y일",
        "theme": "여행 테마",
        "days": [
          {
            "day": 1,
            "date": "2025-03-15",
            "theme": "일차별 테마",
            "activities": [
              {
                "time": "09:00-11:00",
                "title": "활동명",
                "description": "상세 설명",
                "location": "장소명",
                "address": "주소",
                "estimated_cost": 0,
                "tips": "팁",
                "child_friendly": true
              }
            ],
            "restaurants": [
              {
                "meal_type": "lunch",
                "name": "레스토랑명",
                "cuisine": "음식 종류",
                "price_range": "$$",
                "recommended_dishes": "추천 메뉴",
                "location": "위치"
              }
            ],
            "accommodation": {
              "name": "숙소명",
              "type": "호텔/민박 등",
              "location": "위치",
              "price_range": "$$$"
            }
          }
        ],
        "budget_breakdown": {
          "accommodation": 0,
          "food": 0,
          "activities": 0,
          "transportation": 0,
          "total": 0
        },
        "travel_tips": ["팁1", "팁2"],
        "packing_list": ["준비물1", "준비물2"]
      }

      중요사항:
      1. 실제 존재하는 장소와 레스토랑만 추천
      2. 이동 시간과 동선을 고려한 효율적인 일정
      3. 아이와 함께하는 경우 child_friendly 정보 포함
      4. 현지 문화와 관습 정보 포함
      5. 계절과 날씨를 고려한 추천
    PROMPT
  end

  def parse_travel_plan_response(data)
    content = data[:content]
    
    # Extract JSON from the response
    json_match = content.match(/\{[\s\S]*\}/)
    return failure("No valid JSON found in response") unless json_match

    begin
      parsed_data = JSON.parse(json_match[0])
      success(travel_plan: parsed_data, raw_response: content)
    rescue JSON::ParserError => e
      failure("Failed to parse travel plan JSON: #{e.message}")
    end
  end
end