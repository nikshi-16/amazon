import { HomeCard } from "@/components/shared/header/home/home-card";
import { HomeCarousel } from "@/components/shared/header/home/home-carousel";
import ProductSlider from "@/components/shared/product/product-slider";
import { Card, CardContent } from "@/components/ui/card";
import { getAllCategories, getProductByTag, getProductsForCard } from "@/lib/actions/product.actions";
import data from "@/lib/data";
import { toSlug } from "@/lib/utils";

export default async function Page(){
  const categories = (await getAllCategories()).slice(0, 4)
  const newArrivals=await getProductsForCard({
    tag:'new-arrivals',
    limit:4,
  })
  const featureds=await getProductsForCard({
    tag:'featured',
    limit:4,
  })
  const bestsellers= await getProductsForCard({
    tag:'best-sellers',
    limit:4,
  })
  const cards=[
    {
      title: 'Categories to explore',
      link:{
        text:'See More',
        href:'/search',
      },
      items:categories.map((category) => ({
        name: category,
        image:`/images/${toSlug(category)}.jpg`,
        href:`/search?category=${toSlug(category)}`,
      })),
    },
    {
      title:'Explore New Arrivals',
      items:newArrivals,
      link:{
        text:'View All',
        href:'/search?tag=new-arrivals',
      },
    },
    {
      title:'Discover Best Sellers',
      items:bestsellers,
      link:{
        text:'View All',
        href:'/search?tag=new-arrivals',
      },
    },
    {
      title:'Featured Products',
      items:featureds,
      link:{
        text:'Shop Now',
        href:'/search?tag=new-arrivals',
    }
    }
  ]
const todaysDeals=await getProductByTag({tag: 'todays-deal'})
  return(
  <>
  <HomeCarousel items={data.carousels} />;
  <div className="md:p-4 md:space-y-4 bg-border">
    <HomeCard cards={cards} />
    <Card className='w-full rounded-none'>
      <CardContent className="p-4 items-center gap-3">
        <ProductSlider title={"Today's Deals"} products={todaysDeals}/>
        </CardContent>
            </Card>
  </div>
  </>
  )
}