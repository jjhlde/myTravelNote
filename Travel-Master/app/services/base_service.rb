class BaseService
  def self.call(...)
    new(...).call
  end

  private

  def success(data = {})
    OpenStruct.new(success?: true, data: data, errors: [])
  end

  def failure(errors)
    errors = [errors] unless errors.is_a?(Array)
    OpenStruct.new(success?: false, data: {}, errors: errors)
  end

  def log_info(message)
    Rails.logger.info "[#{self.class.name}] #{message}"
  end

  def log_error(message, exception = nil)
    Rails.logger.error "[#{self.class.name}] #{message}"
    Rails.logger.error exception.full_message if exception
  end

  def with_error_handling
    yield
  rescue StandardError => e
    log_error("Unexpected error", e)
    failure("An unexpected error occurred: #{e.message}")
  end
end