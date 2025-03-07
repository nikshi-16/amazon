const data = {
    headerMenus: [
        {
            name: "Today's Deal",
            href: "/search?tag=today%27s-deal", // ✅ Escaped apostrophe
        },
        {
            name: "New Arrivals",
            href: "/search?tag=new-arrivals",
        },
        {
            name: "Featured Product",
            href: "/search?tag=featured-product",
        },
        {
            name: "Best Sellers",
            href: "/search?tag=best-sellers",
        },
        {
            name: "Browsing History",
            href: "/#browsing-history",
        },
        {
            name: "Customer Service",
            href: "/page/customer-service",
        },
        {
            name: "About Us",
            href: "/page/about-us",
        },
    ],
    carousels: [
        {
          title: 'Most Popular Shoes For Sale',
          buttonCaption: 'Shop Now',
          image: '/images/banner3.jpg',
          url: '/search?category=Shoes',
          isPublished: true,
        },
        {
          title: 'Best Sellers in T-Shirts',
          buttonCaption: 'Shop Now',
          image: '/images/banner1.jpg',
          url: '/search?category=T-Shirts',
          isPublished: true,
        },
        {
          title: 'Best Deals on Wrist Watches',
          buttonCaption: 'See More',
          image: '/images/banner2.jpg',
          url: '/search?category=Wrist Watches',
          isPublished: true,
        },
      ],
};
export default data;
