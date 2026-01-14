# Dependency Injection Analysis - Summary

## Executive Summary

This document summarizes the analysis of which service method parameters could be automatically injected through the DI container vs. passed as explicit arguments.

**Main Conclusion:** The current design is mostly optimal. Only one improvement was implemented (BattleService).

## The Key Design Pattern

### ✅ Inject via Constructor (Services & Configuration)
- Other services (ItemService, InventoryService, RewardService)
- Configuration objects (GameConfig)
- Cross-cutting concerns (EventBus)

### ✅ Pass as Method Parameters (Data Objects)
- Game data (Character, Party, Enemy)
- Collections (Inventory arrays, Item lists)
- Operation-specific data

## Analysis Results by Service

### 🔧 Improved: BattleService

**Before:**
```typescript
constructor(config?: GameConfig) {
  this.actionExecutor = new BattleActionExecutor(this.config);
  this.rewardService = new RewardService();
}
```

**After:**
```typescript
constructor(
  config?: GameConfig,
  rewardService?: RewardService,
  actionExecutor?: BattleActionExecutor
) {
  this.rewardService = rewardService || new RewardService();
  this.actionExecutor = actionExecutor || new BattleActionExecutor(this.config);
}
```

**Benefits:**
- ✅ Better testability (can inject mocks)
- ✅ Explicit dependencies
- ✅ Managed by ServiceContainer
- ✅ Backward compatible

### ✅ Optimal: CraftService

```typescript
canCraft(recipe: CraftRecipe, inventory: InventoryItem[], character?: Character)
craft(recipe: CraftRecipe, inventory: InventoryItem[], character?: Character)
```

**Why it's good:**
- Allows processing multiple inventories
- Pure function style - no hidden state
- Easy to test with mock data
- Flexible and reusable

**Why NOT to inject InventoryService:**
- Would limit to single inventory per service instance
- Less flexible for batch operations
- inventory is "data to process", not a "dependency"

### ✅ Optimal: PartyService

```typescript
addMember(party: Combatant[], member: Combatant)
removeMember(party: Combatant[], memberId: UniqueId)
```

**Why it's good:**
- Can manage multiple parties
- Stateless utility service
- Easy to test
- No hidden dependencies

**Why NOT to store party in service:**
- Would require separate service instance per party
- Reduces flexibility
- Party is "data to operate on", not a "dependency"

### ✅ Optimal: ItemService

```typescript
useItem(item: ConsumableItem, target: Combatant, conditions: ItemUseConditions)
```

**Why it's good:**
- Completely stateless
- Pure calculation service
- Extremely testable
- No dependencies needed

### ✅ Well-designed: ShopService

```typescript
constructor(shop: Shop, inventoryService: InventoryService, eventBus?: EventBus)
buyItem(character: Character, shopItemIndex: number, quantity: number)
```

**Why it's good:**
- Shop and InventoryService are true dependencies (injected)
- Character is operation data (passed as parameter)
- Clear separation of concerns

### ✅ Well-designed: InventoryService

```typescript
constructor(inventory: Inventory, eventBus?: EventBus)
addItem(item: Item, quantity: number)
```

**Why it's good:**
- Manages a specific inventory instance
- State is appropriate for this service
- Correctly injected in GEasyKit

## Design Guidelines

### When to Use Constructor Injection

```typescript
✅ constructor(otherService: OtherService, config: Config, eventBus: EventBus)
```

**Use for:**
1. Service dependencies
2. Configuration objects
3. Cross-cutting concerns (EventBus)
4. Objects used throughout service lifetime

**Indicators:**
- Service needs it for entire lifecycle
- Same instance used for all operations
- Dependency relationship (not data processing)

### When to Use Method Parameters

```typescript
✅ processData(character: Character, party: Party[], inventory: Inventory[])
```

**Use for:**
1. Game data (Character, Enemy, Party)
2. Collections being processed
3. Operation-specific data
4. Data that varies per method call

**Indicators:**
- Different data for each method call
- Need to process multiple instances
- Pure function style preferred
- Testing requires different data sets

## Common Pitfalls to Avoid

### ❌ Don't Over-inject Data

**Bad:**
```typescript
class CraftService {
  constructor(inventory: Inventory[]) {}  // ❌ Too rigid
  craft(recipe: Recipe) {}
}
```

**Good:**
```typescript
class CraftService {
  craft(recipe: Recipe, inventory: Inventory[]) {}  // ✅ Flexible
}
```

### ❌ Don't Under-inject Services

**Bad:**
```typescript
class BattleService {
  executeAction() {
    const rewards = new RewardService();  // ❌ Hidden dependency
  }
}
```

**Good:**
```typescript
class BattleService {
  constructor(rewardService: RewardService) {}  // ✅ Explicit
}
```

## Benefits of Current Design

### 1. Flexibility
- Services can process multiple data instances
- No artificial limitations
- Easy to use in different contexts

### 2. Testability
- Pass mock data directly to methods
- No need to mock entire service instances
- Predictable behavior

### 3. Clarity
- Clear what's a dependency vs. data
- No hidden state
- Easy to understand data flow

### 4. Reusability
- Services work as pure utilities
- Can be used in different scenarios
- No coupling to specific data instances

## Implementation Status

### ✅ Completed
- BattleService now properly injects RewardService and BattleActionExecutor
- GEasyKit correctly registers BattleActionExecutor
- Added comprehensive tests for dependency injection
- Created detailed analysis documentation

### 📝 No Changes Needed
- ItemService - optimal as-is
- CraftService - optimal as-is
- PartyService - optimal as-is
- EquipmentService - optimal as-is
- All other services follow correct patterns

## Testing

All improvements are validated with comprehensive tests:

```typescript
describe('GEasyKit Dependency Injection', () => {
  it('should inject dependencies into BattleService');
  it('should return same instance for singleton services');
  it('should detect circular dependencies');
  // ... 10 tests total
});
```

**Test Results:** ✅ All 565 tests pass

## Conclusion

The GEasy-Kit library demonstrates excellent separation between:
- **Dependencies** (injected via constructor): Services, Config, EventBus
- **Data** (passed as parameters): Character, Party, Inventory, Items

Only BattleService needed improvement to properly inject its service dependencies. All other services already follow best practices.

This design provides the optimal balance of:
- Flexibility (can handle multiple data instances)
- Testability (easy to mock and test)
- Clarity (explicit dependencies)
- Maintainability (predictable behavior)
