<?php

namespace Database\Seeders;

use App\Models\MenuItem;
use App\Models\MenuChannelStatus;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class MenuItemSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $items = [
            ['Bread',  'Sourdough Loaf',        8.50],
            ['Bread',  'White Bloomer',          4.50],
            ['Bread',  'Rye Bread',              6.00],
            ['Bread',  'Seeded Roll',            1.80],
            ['Bread',  'Focaccia',               5.50],
            ['Pastry', 'Croissant',              2.50],
            ['Pastry', 'Pain au Chocolat',       2.80],
            ['Pastry', 'Almond Danish',          3.20],
            ['Pastry', 'Cinnamon Roll',          3.50],
            ['Pastry', 'Fruit Danish',           3.00],
            ['Cakes',  'Victoria Sponge',        3.80],
            ['Cakes',  'Lemon Drizzle',          3.50],
            ['Cakes',  'Carrot Cake',            4.00],
            ['Cakes',  'Brownie',                2.80],
            ['Cakes',  'Cheesecake',             4.50],
            ['Drinks', 'Americano',              2.80],
            ['Drinks', 'Flat White',             3.20],
            ['Drinks', 'Cappuccino',             3.50],
            ['Drinks', 'Tea',                    2.20],
            ['Drinks', 'Fresh OJ',               3.80],
            ['Savory', 'Cheese Twist',           2.20],
            ['Savory', 'Sausage Roll',           3.50],
            ['Savory', 'Ham & Cheese Croissant', 4.50],
            ['Savory', 'Spinach Quiche',         4.80],
            ['Savory', 'Cheese & Onion Pasty',   4.20],
        ];

        foreach ($items as [$cat, $name, $price]) {
            // Skip if already seeded
            if (MenuItem::where('item_name', $name)->exists()) continue;

            $item = MenuItem::create([
                'item_name'     => $name,
                'unit_cost'     => $price,
                'category_name' => $cat,
                'is_published'  => true,
                'is_archived'   => false,
            ]);

            MenuChannelStatus::insert([
                ['item_id' => $item->item_id, 'order_type_id' => 1, 'is_available' => true],
                ['item_id' => $item->item_id, 'order_type_id' => 2, 'is_available' => true],
            ]);
        }
    }
}
