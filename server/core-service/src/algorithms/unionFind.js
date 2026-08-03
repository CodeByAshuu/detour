/**
 * Calculates the Haversine distance between two coordinates in kilometers.
 * Coordinates are represented as GeoJSON Point arrays: [longitude, latitude].
 * 
 * @param {number[]} coord1 - [longitude, latitude] of point 1
 * @param {number[]} coord2 - [longitude, latitude] of point 2
 * @returns {number} Distance in kilometers
 */
function haversineDistance(coord1, coord2) {
  // Extract longitude and latitude from GeoJSON arrays [lng, lat]
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  // Earth's radius in kilometers
  const R = 6371;

  // Convert degree differences to radians
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  // Convert base latitudes to radians for cosine calculation
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;

  // Haversine formula calculation for spherical distance
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);

  // Compute central angle using atan2 for numerical stability
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Return distance in kilometers
  return R * c;
}

/**
 * Union-Find (Disjoint-Set Union / DSU) Data Structure.
 * Implements Path Compression and Union by Rank to achieve O(alpha(N)) amortized time complexity per operation.
 */
class UnionFind {
  /**
   * Initializes UnionFind data structure with an optional array of elements.
   * @param {Array<string|number>} elements - Initial element identifiers (e.g. order IDs)
   */
  constructor(elements = []) {
    // Map to store parent pointers: parent.get(x) points to parent of x
    this.parent = new Map();

    // Map to store rank (tree depth approximation) to keep trees flat during unions
    this.rank = new Map();

    // Add initial elements to the disjoint set if provided
    for (const item of elements) {
      this.add(item);
    }
  }

  /**
   * Adds a new element as an isolated set pointing to itself with rank 0.
   * @param {string|number} item - Unique identifier of the element
   */
  add(item) {
    if (!this.parent.has(item)) {
      // Every element initially starts as its own representative root
      this.parent.set(item, item);
      // Initial rank (tree height upper bound) is 0
      this.rank.set(item, 0);
    }
  }

  /**
   * Finds the representative root of the set containing item.
   * Uses PATH COMPRESSION: recursively updates parent pointers of all visited nodes
   * to point directly to the root, flattening the tree structure for subsequent queries.
   * 
   * @param {string|number} item - Element to find root for
   * @returns {string|number} Representative root of the set
   */
  find(item) {
    // If element is not registered, register it dynamically
    if (!this.parent.has(item)) {
      this.add(item);
    }

    // Base case: If item is its own parent, it is the representative root
    if (this.parent.get(item) === item) {
      return item;
    }

    // Recursive step with PATH COMPRESSION:
    // Update the parent pointer of item to point directly to the root found recursively
    const root = this.find(this.parent.get(item));
    this.parent.set(item, root);

    // Return the root representative
    return root;
  }

  /**
   * Merges the sets containing item1 and item2.
   * Uses UNION BY RANK: attaches the tree with smaller rank under the root of the tree with larger rank.
   * If ranks are equal, one is chosen arbitrarily as root and its rank is incremented by 1.
   * 
   * @param {string|number} item1 - First element
   * @param {string|number} item2 - Second element
   * @returns {boolean} True if sets were merged, false if already in the same set
   */
  union(item1, item2) {
    // Find representative roots for both elements
    const root1 = this.find(item1);
    const root2 = this.find(item2);

    // If both elements already share the same root, they are in the same cluster/set
    if (root1 === root2) {
      return false;
    }

    // Get current tree ranks for both roots
    const rank1 = this.rank.get(root1);
    const rank2 = this.rank.get(root2);

    // UNION BY RANK LOGIC:
    // Attach lower-rank tree under higher-rank tree root to minimize total tree height growth
    if (rank1 < rank2) {
      this.parent.set(root1, root2);
    } else if (rank1 > rank2) {
      this.parent.set(root2, root1);
    } else {
      // Ranks are equal: pick root1 as new parent and increment its rank by 1
      this.parent.set(root2, root1);
      this.rank.set(root1, rank1 + 1);
    }

    return true;
  }

  /**
   * Groups all elements into clusters based on their representative roots.
   * Performs path compression on all keys to ensure accurate mapping.
   * 
   * @returns {Map<string|number, Array<string|number>>} Map of root -> Array of element IDs in cluster
   */
  getGroups() {
    const groups = new Map();

    for (const item of this.parent.keys()) {
      // Find the absolute root for this item (ensures path compression happens)
      const root = this.find(item);

      if (!groups.has(root)) {
        groups.set(root, []);
      }
      groups.get(root).push(item);
    }

    return groups;
  }
}

/**
 * Clusters delivery orders into geographical zones using Union-Find.
 * Two orders are merged into the same cluster if their delivery destinations are
 * within thresholdKm. Pickup points are often the same depot and must not be
 * used for dispatch clustering.
 * 
 * @param {Array<Object>} orders - Array of order objects (must have _id and dropPoint.coordinates)
 * @param {number} thresholdKm - Maximum distance in km between orders to belong to the same cluster
 * @returns {Array<Object>} Array of clusters with cluster ID, centroid coordinates, and order list
 */
function clusterOrders(orders = [], thresholdKm = 3.0) {
  // Edge case: Empty input returns empty clusters
  if (!orders || orders.length === 0) {
    return [];
  }

  // Extract order IDs for Union-Find initialization
  const orderIds = orders.map((o) => String(o._id));
  const uf = new UnionFind(orderIds);

  // Map order IDs to their actual objects for quick lookup
  const orderMap = new Map();
  orders.forEach((o) => orderMap.set(String(o._id), o));
  const deliveryCoordinates = (order) => order.dropPoint?.coordinates || order.pickupPoint?.coordinates;

  // Pairwise distance comparison between all unassigned delivery points: O(N^2)
  for (let i = 0; i < orders.length; i++) {
    for (let j = i + 1; j < orders.length; j++) {
      const orderA = orders[i];
      const orderB = orders[j];

      // Calculate distance between delivery locations, not the common depot.
      const dist = haversineDistance(
        deliveryCoordinates(orderA),
        deliveryCoordinates(orderB)
      );

      // If within proximity threshold, merge into the same disjoint set / cluster
      if (dist <= thresholdKm) {
        uf.union(String(orderA._id), String(orderB._id));
      }
    }
  }

  // Retrieve disjoint groups from Union-Find
  const groupedMap = uf.getGroups();
  const clusters = [];

  let clusterIndex = 1;

  // Process each group to build zone cluster objects with calculated centroid
  for (const [rootId, memberIds] of groupedMap.entries()) {
    const clusterOrdersList = memberIds.map((id) => orderMap.get(id));

    // Compute geographic centroid (average longitude and latitude) for the cluster
    let totalLng = 0;
    let totalLat = 0;

    for (const order of clusterOrdersList) {
      const [lng, lat] = deliveryCoordinates(order);
      totalLng += lng;
      totalLat += lat;
    }

    const centroid = [
      totalLng / clusterOrdersList.length,
      totalLat / clusterOrdersList.length,
    ];

    clusters.push({
      clusterId: `ZONE-${clusterIndex++}`,
      rootId,
      centroid,
      orderCount: clusterOrdersList.length,
      orders: clusterOrdersList,
    });
  }

  return clusters;
}

module.exports = {
  haversineDistance,
  UnionFind,
  clusterOrders,
};
