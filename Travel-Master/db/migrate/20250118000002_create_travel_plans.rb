class CreateTravelPlans < ActiveRecord::Migration[7.1]
  def change
    create_table :travel_plans do |t|
      t.references :user, null: false, foreign_key: true
      t.string :title, null: false
      t.string :destination, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.integer :travelers_count, default: 1
      t.string :budget_range
      t.text :user_input
      t.jsonb :ai_response, default: {}
      t.jsonb :preferences, default: {}
      t.string :status, default: 'draft'
      t.string :unique_slug, null: false
      t.datetime :pwa_generated_at
      t.jsonb :pwa_metadata, default: {}

      t.timestamps
    end

    add_index :travel_plans, :user_id
    add_index :travel_plans, :unique_slug, unique: true
    add_index :travel_plans, :status
    add_index :travel_plans, :destination
    add_index :travel_plans, [:start_date, :end_date]
    add_index :travel_plans, :ai_response, using: :gin
    add_index :travel_plans, :preferences, using: :gin
  end
end