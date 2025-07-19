class CreateDays < ActiveRecord::Migration[7.1]
  def change
    create_table :days do |t|
      t.references :travel_plan, null: false, foreign_key: true
      t.date :date, null: false
      t.integer :day_number, null: false
      t.string :theme
      t.text :notes
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :days, [:travel_plan_id, :day_number], unique: true
    add_index :days, :date
    add_index :days, :metadata, using: :gin
  end
end