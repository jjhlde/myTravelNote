class CreateActivities < ActiveRecord::Migration[7.1]
  def change
    create_table :activities do |t|
      t.references :day, null: false, foreign_key: true
      t.string :time_slot, null: false
      t.string :title, null: false
      t.text :description
      t.string :location_name
      t.string :google_maps_url
      t.jsonb :location_data, default: {}
      t.decimal :estimated_cost, precision: 10, scale: 2
      t.string :activity_type
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :activities, :time_slot
    add_index :activities, :activity_type
    add_index :activities, :location_data, using: :gin
    add_index :activities, :metadata, using: :gin
  end
end