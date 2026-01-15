import { useEffect } from 'react';
import { useStore } from '../store';
import { NetworkEvent } from '../types';
import { parseGraphQLBody, safeJSONParse } from '../utils/parsing';

// Simple ID generator if uuid package isn't present, though it's standard to add it.
// For now, simple random string to avoid install steps if not requested.
const generateId = () => Math.random().toString(36).substring(2, 15);

export const useNetworkMonitor = () => {
  const addEvent = useStore((state) => state.addEvent);

  useEffect(() => {
    // @ts-ignore
    if (typeof chrome === 'undefined' || !chrome.devtools) {
      console.warn("Chrome DevTools API not available. Starting in Mock Mode.");

      // Realistic mock operations with full queries
      const mockOperations = [
        {
          operationName: 'GetUserProfile',
          operationType: 'query',
          query: `query GetUserProfile($userId: ID!, $includeStats: Boolean = true) {
  user(id: $userId) {
    id
    email
    displayName
    avatar {
      url
      thumbnailUrl
    }
    profile {
      bio
      website
      location
      joinedAt
    }
    stats @include(if: $includeStats) {
      followers
      following
      posts
    }
  }
}`,
          variables: { userId: "usr_2847291", includeStats: true },
          response: {
            data: {
              user: {
                id: "usr_2847291",
                email: "sarah.chen@example.com",
                displayName: "Sarah Chen",
                avatar: { url: "https://cdn.example.com/avatars/2847291.jpg", thumbnailUrl: "https://cdn.example.com/avatars/2847291_thumb.jpg" },
                profile: { bio: "Full-stack developer | Open source enthusiast", website: "https://sarahchen.dev", location: "San Francisco, CA", joinedAt: "2022-03-15T08:00:00Z" },
                stats: { followers: 1243, following: 567, posts: 89 }
              }
            }
          }
        },
        {
          operationName: 'CreatePost',
          operationType: 'mutation',
          query: `mutation CreatePost($input: CreatePostInput!) {
  createPost(input: $input) {
    post {
      id
      title
      content
      slug
      status
      author {
        id
        displayName
      }
      tags {
        id
        name
      }
      createdAt
      updatedAt
    }
    errors {
      field
      message
    }
  }
}`,
          variables: {
            input: {
              title: "Getting Started with GraphQL",
              content: "GraphQL is a powerful query language...",
              tags: ["graphql", "api", "tutorial"],
              status: "DRAFT"
            }
          },
          response: {
            data: {
              createPost: {
                post: {
                  id: "post_9283746",
                  title: "Getting Started with GraphQL",
                  content: "GraphQL is a powerful query language...",
                  slug: "getting-started-with-graphql",
                  status: "DRAFT",
                  author: { id: "usr_2847291", displayName: "Sarah Chen" },
                  tags: [{ id: "tag_1", name: "graphql" }, { id: "tag_2", name: "api" }, { id: "tag_3", name: "tutorial" }],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                },
                errors: null
              }
            }
          }
        },
        {
          operationName: 'SearchProducts',
          operationType: 'query',
          query: `query SearchProducts(
  $query: String!
  $filters: ProductFilters
  $pagination: PaginationInput
  $sortBy: ProductSortField = RELEVANCE
) {
  searchProducts(
    query: $query
    filters: $filters
    pagination: $pagination
    sortBy: $sortBy
  ) {
    totalCount
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
    edges {
      cursor
      node {
        id
        name
        description
        price {
          amount
          currency
        }
        inventory {
          available
          reserved
        }
        images {
          url
          alt
        }
      }
    }
  }
}`,
          variables: {
            query: "wireless headphones",
            filters: { category: "ELECTRONICS", priceRange: { min: 50, max: 300 }, inStock: true },
            pagination: { first: 10, after: null },
            sortBy: "PRICE_ASC"
          },
          response: {
            data: {
              searchProducts: {
                totalCount: 47,
                pageInfo: { hasNextPage: true, hasPreviousPage: false, startCursor: "YXJyYXljb25uZWN0aW9uOjA=", endCursor: "YXJyYXljb25uZWN0aW9uOjk=" },
                edges: [
                  { cursor: "YXJyYXljb25uZWN0aW9uOjA=", node: { id: "prod_001", name: "Studio Pro Headphones", description: "Premium wireless headphones with ANC", price: { amount: 149.99, currency: "USD" }, inventory: { available: 234, reserved: 12 }, images: [{ url: "https://cdn.example.com/products/001.jpg", alt: "Studio Pro Headphones" }] } }
                ]
              }
            }
          }
        },
        {
          operationName: 'UpdateOrderStatus',
          operationType: 'mutation',
          query: `mutation UpdateOrderStatus(
  $orderId: ID!
  $status: OrderStatus!
  $notes: String
  $notifyCustomer: Boolean = true
) {
  updateOrderStatus(
    orderId: $orderId
    status: $status
    notes: $notes
    notifyCustomer: $notifyCustomer
  ) {
    order {
      id
      status
      statusHistory {
        status
        changedAt
        changedBy {
          id
          name
        }
        notes
      }
      customer {
        email
        notificationPreferences {
          email
          sms
        }
      }
    }
    notificationSent
    success
  }
}`,
          variables: {
            orderId: "ord_8273645",
            status: "SHIPPED",
            notes: "Shipped via FedEx - Tracking #1234567890",
            notifyCustomer: true
          },
          response: {
            data: {
              updateOrderStatus: {
                order: {
                  id: "ord_8273645",
                  status: "SHIPPED",
                  statusHistory: [
                    { status: "PENDING", changedAt: "2025-01-14T10:00:00Z", changedBy: { id: "sys", name: "System" }, notes: "Order placed" },
                    { status: "PROCESSING", changedAt: "2025-01-14T14:30:00Z", changedBy: { id: "usr_001", name: "John D." }, notes: null },
                    { status: "SHIPPED", changedAt: new Date().toISOString(), changedBy: { id: "usr_002", name: "Alice M." }, notes: "Shipped via FedEx - Tracking #1234567890" }
                  ],
                  customer: { email: "customer@example.com", notificationPreferences: { email: true, sms: false } }
                },
                notificationSent: true,
                success: true
              }
            }
          }
        },
        {
          operationName: 'GetDashboardAnalytics',
          operationType: 'query',
          query: `query GetDashboardAnalytics(
  $dateRange: DateRangeInput!
  $metrics: [MetricType!]!
  $groupBy: TimeGranularity = DAY
) {
  analytics(dateRange: $dateRange) {
    summary {
      totalRevenue
      totalOrders
      averageOrderValue
      conversionRate
    }
    timeSeries(metrics: $metrics, groupBy: $groupBy) {
      timestamp
      values {
        metric
        value
        percentChange
      }
    }
    topProducts(limit: 5) {
      product {
        id
        name
      }
      revenue
      unitsSold
    }
  }
}`,
          variables: {
            dateRange: { start: "2025-01-01", end: "2025-01-15" },
            metrics: ["REVENUE", "ORDERS", "PAGE_VIEWS"],
            groupBy: "DAY"
          },
          response: {
            data: {
              analytics: {
                summary: { totalRevenue: 125430.50, totalOrders: 892, averageOrderValue: 140.62, conversionRate: 3.2 },
                timeSeries: [
                  { timestamp: "2025-01-15", values: [{ metric: "REVENUE", value: 8934.20, percentChange: 12.5 }, { metric: "ORDERS", value: 67, percentChange: 8.1 }] }
                ],
                topProducts: [
                  { product: { id: "prod_001", name: "Studio Pro Headphones" }, revenue: 14999.00, unitsSold: 100 }
                ]
              }
            }
          }
        },
        {
          operationName: 'SubscribeToNotifications',
          operationType: 'subscription',
          query: `subscription SubscribeToNotifications($userId: ID!, $types: [NotificationType!]) {
  notifications(userId: $userId, types: $types) {
    id
    type
    title
    message
    metadata {
      ... on OrderNotification {
        orderId
        orderStatus
      }
      ... on MessageNotification {
        senderId
        conversationId
      }
    }
    read
    createdAt
  }
}`,
          variables: { userId: "usr_2847291", types: ["ORDER_UPDATE", "NEW_MESSAGE", "SYSTEM"] },
          response: {
            data: {
              notifications: {
                id: "notif_001",
                type: "ORDER_UPDATE",
                title: "Order Shipped",
                message: "Your order #8273645 has been shipped!",
                metadata: { orderId: "ord_8273645", orderStatus: "SHIPPED" },
                read: false,
                createdAt: new Date().toISOString()
              }
            }
          }
        }
      ];

      let mockIndex = 0;

      const interval = setInterval(() => {
        const mockOp = mockOperations[mockIndex % mockOperations.length];
        mockIndex++;

        const responseStr = JSON.stringify(mockOp.response, null, 2);

        const mockEvent: NetworkEvent = {
          id: generateId(),
          requestId: `req-${Date.now()}`,
          timestamp: Date.now(),
          url: 'https://api.example.com/graphql',
          method: 'POST',
          status: 200,
          requestHeaders: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            'X-Request-ID': generateId(),
            'User-Agent': 'GraphQeLves/1.0'
          },
          requestBodyRaw: JSON.stringify({ query: mockOp.query, variables: mockOp.variables }),
          graphql: {
            operationName: mockOp.operationName,
            operationType: mockOp.operationType as any,
            query: mockOp.query,
            variables: mockOp.variables
          },
          responseHeaders: {
            'Content-Type': 'application/json',
            'X-Response-Time': `${Math.floor(Math.random() * 200) + 50}ms`
          },
          responseBodyRaw: responseStr,
          responseBodyJson: mockOp.response,
          responseSize: new TextEncoder().encode(responseStr).length,
          duration: Math.floor(Math.random() * 400) + 80,
          isBatched: false
        };
        addEvent(mockEvent);
      }, 2500);
      return () => clearInterval(interval);
    }

    const handleRequest = async (request: any) => {
      // 1. Filter: Must be JSON or end in /graphql
      const isJson = request.request.postData?.mimeType?.includes('application/json');
      const isGraphQLUrl = request.request.url.endsWith('/graphql');
      
      if (!isJson && !isGraphQLUrl) return;

      // 2. Parse Body
      const payloads = parseGraphQLBody(request.request.postData);
      if (!payloads || payloads.length === 0) return;

      // 3. Get Response Body (Async)
      request.getContent((content: string, _encoding: string) => {
        const responseJson = safeJSONParse(content);

        const headersToRecord = (headers: any[]) =>
          headers.reduce((acc, h) => ({ ...acc, [h.name]: h.value }), {});

        // Calculate response size - prefer bodySize, fallback to content length
        const getResponseSize = (): number => {
          // Try HAR bodySize first
          if (request.response.bodySize > 0) {
            return request.response.bodySize;
          }
          // Try content-length header
          const contentLengthHeader = request.response.headers.find(
            (h: any) => h.name.toLowerCase() === 'content-length'
          );
          if (contentLengthHeader) {
            const parsed = parseInt(contentLengthHeader.value, 10);
            if (!isNaN(parsed) && parsed > 0) return parsed;
          }
          // Fallback to actual content byte length
          if (content) {
            return new TextEncoder().encode(content).length;
          }
          return 0;
        };

        // 4. Create Events (Handle Batching)
        payloads.forEach((payload, index) => {
          const event: NetworkEvent = {
            id: generateId(),
            requestId: request.request.id || generateId(),
            timestamp: new Date(request.startedDateTime).getTime(),
            url: request.request.url,
            method: request.request.method,
            status: request.response.status,

            requestHeaders: headersToRecord(request.request.headers),
            requestBodyRaw: request.request.postData?.text || null,
            graphql: payload,

            responseHeaders: headersToRecord(request.response.headers),
            responseBodyRaw: content,
            responseBodyJson: responseJson,
            responseSize: getResponseSize(),
            duration: request.time,

            isBatched: payloads.length > 1,
            batchIndex: payloads.length > 1 ? index : undefined,
          };

          addEvent(event);
        });
      });
    };

    // @ts-ignore
    chrome.devtools.network.onRequestFinished.addListener(handleRequest);

    return () => {
      // @ts-ignore
      chrome.devtools.network.onRequestFinished.removeListener(handleRequest);
    };
  }, [addEvent]);
};