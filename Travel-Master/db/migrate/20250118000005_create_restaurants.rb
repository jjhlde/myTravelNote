class CreateRestaurants < ActiveRecord::Migration[7.1]
  def change
    create_table :restaurants do |t|
      t.references :day, null: false, foreign_key: true
      t.string :meal_type, null: false
      t.string :name, null: false
      t.string :cuisine_type
      t.string :google_maps_url
      t.jsonb :location_data, default: {}
      t.string :price_range
      t.text :recommended_dishes
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :restaurants, :meal_type
    add_index :restaurants, :cuisine_type
    add_index :restaurants, :price_range
    add_index :restaurants, :location_data, using: :gin
    add_index :restaurants, :metadata, using: :gin
  end
end