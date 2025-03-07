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
};
export default data;
