export const MOCK_PODCAST_DATA = {
    // Matches "Discover" section
    discover: [
        {
            id: 750734,
            title: "Podcasting 2.0",
            author: "Adam Curry & Dave Jones",
            image: "https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/886311/886311-1600806460493-2c6c06830560a.jpg",
            category: "Technology",
            itunesId: 1533534438,
            value: {
                model: {
                    type: "lightning",
                    method: "keysend"
                },
                destinations: [
                    {
                        name: "The P20 Node",
                        type: "node",
                        address: "03ae9f91a0cb8ff43840e3c322c4c61f019d8c1c3cea15a25cfc425660de03f27ec",
                        split: 100
                    }
                ]
            }
        },
        {
            id: 123456,
            title: "The Daily Tech",
            author: "Tech Network",
            image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80",
            category: "Technology",
            itunesId: null,
            value: null
        },
        {
            id: 920666,
            title: "Modern Finance",
            author: "Nairobi Biz",
            image: "https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800&q=80",
            category: "Business",
            itunesId: 123456789,
            value: {
                model: {
                    type: "mpesa",
                    method: "paybill"
                },
                destinations: [
                    {
                        name: "Creator Wallet",
                        address: "254700000000",
                        split: 100
                    }
                ]
            }
        }
    ],
    // Matches "Top Creators" section
    creators: [
        { id: 1, name: "Adam Curry", handle: "@adam", avatar: "https://pbs.twimg.com/profile_images/1283733276686364673/qj6qJj5-_400x400.jpg", bio: "The Podfather" },
        { id: 2, name: "Joe Rogan", handle: "@joerogan", avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=800&q=80", bio: "JRE Experience" },
        { id: 3, name: "Nairobi Biz", handle: "@nairobibiz", avatar: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=800&q=80", bio: "Finance & Tech" }
    ],
    // Matches "Trending Now" section
    trending: [
        { id: 987654, title: "Modern Finance", author: "Nairobi Biz", image: "https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800&q=80", views: "1.2k" },
        { id: 456789, title: "Nairobi Nights", author: "Urban Pods", image: "https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=800&q=80", views: "800" },
        { id: 112233, title: "Tech Talk", author: "John Doe", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80", views: "650" }
    ]
};
