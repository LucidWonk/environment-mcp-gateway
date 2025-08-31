# Trading Concepts - Ubiquitous Language

## Purpose & Scope
This document establishes vocabulary expanding typical trading concepts, which are used throughout the trading algorithm platform. These terms form the ubiquitous language that bridges business requirements and technical implementation.

## Core Trading Methodology

### Fibonacci-Based Trading
The system implements **Carolyn Boroden's Fibonacci trading methodology**, which uses mathematical relationships to identify high-probability trading opportunities.

#### Key Principles
- **Algorithmic approach** - Systematic rules eliminate emotional decision-making
- **Probabilistic outcomes** - Focus on long-term statistical edge rather than individual trades
- **Risk management** - No single trade risks more than 2-3% of capital
- **Multi-timeframe analysis** - Patterns confirmed across different time horizons

## Market Data Concepts

### Time Series Data
- **Ticker Bar** - OHLCV data for a specific time period (Open, High, Low, Close, Volume)
- **Time Frame** - Duration of each bar (1min, 5min, 15min, 30min, 1hr, 4hr, daily, weekly)
- **Multi-Time Frame (MTF)** - Analysis across multiple time frames simultaneously

### Market Structure

#### Price Movements
- **Swing High** - A peak in price action surrounded by lower highs
- **Swing Low** - A trough in price action surrounded by higher lows
- **Higher High (HH)** - A swing high that exceeds the previous swing high
- **Higher Low (HL)** - A swing low that is above the previous swing low
- **Lower High (LH)** - A swing high that is below the previous swing high
- **Lower Low (LL)** - A swing low that is below the previous swing low

#### Trend Identification
- **Uptrend** - Series of higher highs and higher lows
- **Downtrend** - Series of lower highs and lower lows
- **Sideways/Consolidation** - Price moving within a range without clear directional bias

## Inflection Point Analysis

### Inflection Points
**Definition**: Significant turning points in price action where trend direction changes.

#### Types
- **Top** - An inflection point marking the end of an upward move
- **Bottom** - An inflection point marking the end of a downward move
- **None** - No significant inflection detected

#### Detection Rules
Price movement patterns between consecutive bars determine inflection points:
- **Higher Highs + Higher Lows** → Top inflection
- **Lower Highs + Lower Lows** → Bottom inflection
- **Higher Highs + Lower Lows** → Continue previous trend direction
- **Other patterns** → Evaluate trend continuation vs. reversal

#### Inflection Point Validation
- **Continuous trends are removed** - Only actual turning points remain
- **Real-time processing** - Inflection points identified as new data arrives
- **Historical consistency** - Algorithm produces same results on historical data

## Fractal Analysis

### Fractal Legs
**Definition**: Price movements between consecutive inflection points, representing significant directional moves.

#### Fractal Leg Properties
- **Start Time/Price** - Beginning inflection point
- **End Time/Price** - Ending inflection point  
- **Direction** - Up (+1) or Down (-1)
- **Depth** - Hierarchical level (0 = base level, higher = meta levels)
- **Level** - Position within the fractal hierarchy

#### Meta Fractal Legs
**Definition**: Higher-order fractal legs composed of multiple lower-level legs.

##### Formation Rules
- **Minimum 3 legs** required for meta fractal formation
- **Odd number of legs** only (3, 5, 7, etc.)
- **Alternating directions** - Up/Down/Up or Down/Up/Down pattern
- **Valid continuation** - Each leg must respect trend structure:
  - **Uptrend meta leg**: Higher highs on continuation legs, higher lows on retracement legs
  - **Downtrend meta leg**: Lower lows on continuation legs, lower highs on retracement legs

##### Meta Fractal Validation
```
Example Uptrend Meta Fractal (5 legs):
Leg 1 (Up): Low=100, High=110
Leg 2 (Down): High=110, Low=105 (retracement - Low > previous Low ✓)
Leg 3 (Up): Low=105, High=115 (continuation - High > previous High ✓)
Leg 4 (Down): High=115, Low=108 (retracement - Low > previous Low ✓)
Leg 5 (Up): Low=108, High=120 (continuation - High > previous High ✓)
```

#### Fractal Hierarchy
- **Base Fractal Legs (Depth 0)** - Direct price movements between inflection points
- **Meta Fractal Legs (Depth 1+)** - Composed of lower-depth fractal legs
- **Parent-Child Relationships** - Higher-level legs contain lower-level legs
- **Time Alignment** - Parent legs span the time of all contained child legs

## Fibonacci Analysis

### Fibonacci Ratios
Standard Fibonacci ratios used for price analysis:
- **Retracements**: 0.382, 0.50, 0.618, 0.786
- **Extensions**: 1.272, 1.618
- **Projections**: 1.0 (100%), 1.618

### Fibonacci Price Calculations

#### Price Retracements
**Purpose**: Identify potential support/resistance during pullbacks.
- **Up Swing Retracement**: Prior high-to-low movement projected from current high
- **Down Swing Retracement**: Prior low-to-high movement projected from current low

#### Price Extensions  
**Purpose**: Identify potential targets for trend continuation.
- **Up Swing Extension**: Prior low-to-high movement projected from current low
- **Down Swing Extension**: Prior high-to-low movement projected from current high

#### Price Projections (Symmetry)
**Purpose**: Identify targets based on measured moves.
- **Measure prior swing** and project equal distance from new reference point
- **Multiple projections** can be calculated from same reference point

### Setup Detection

#### Fibonacci Price Cluster Setup
**Definition**: Confluence of at least 3 Fibonacci price relationships within a tight range.

**Requirements**:
- **Minimum 3 Fibonacci levels** converging in price zone
- **Tight tolerance**: 
  - Futures: ±2-3 ticks
  - Intraday Stocks: ±$0.20-$0.80  
  - Daily Stocks: ±$2.00

#### Symmetry Setup
**Definition**: 100% price projection (measured move) from a reference point.
- **Measure prior swing** in opposite direction of trend
- **Project from new high/low** in trend direction
- **Only consider pullback moves** for projection reference

#### Time Resistance Setup
**Definition**: Time-based confluence points (implementation pending).

### Trigger Detection

#### Chart Timeframes
- **Setup Chart**: Higher timeframe used to identify Fibonacci setups
- **Trigger Chart**: Lower timeframe used to identify entry signals

#### Trigger Requirements
**ALL criteria must be met**:
1. **Trend Alignment**: Direction matches setup chart trend (EMA 13,5)
2. **Moving Average Cross**: 
   - Buy: Fast MA crosses above Slow MA
   - Sell: Fast MA crosses below Slow MA  
3. **New High/Low**: 
   - Buy: Price breaks above previous swing high
   - Sell: Price breaks below previous swing low

#### Confirmation Indicators (Optional)
- **TTM Squeeze** - Additional momentum confirmation
- **CCI(14,50)** - Momentum indicator filter
- **Pullback Entry** - Wait for retracement after initial trigger (increases probability)

## Risk Management Concepts

### Position Sizing
- **Maximum Risk**: 2-3% of total portfolio per trade
- **Risk Calculation**: Combination of stop placement and position size
- **Stop Loss Required**: All stock/futures positions must have stops

### Stop Placement Rules
- **Price Cluster Stops**: Just outside the setup zone
- **Technical Stops**: Outside last significant high/low  
- **Hybrid Stops**: Split between cluster and technical levels
- **Maximum Stop**: ES futures capped at 2 points maximum loss

### Target Management  
- **Initial Target**: 1.272 Fibonacci extension
- **Secondary Targets**: 1.618, 2.618 extensions
- **Trailing Stops**: ATR-based (110% ATR) to avoid premature exits
- **Partial Profits**: Take 50% at respected Fibonacci levels

## Chart Analysis Timeframes

### Setup and Trigger Chart Relationships

| Trade Type | Security | Setup Chart | Trigger Chart | Setup EMAs | Trigger EMAs |
|------------|----------|-------------|---------------|------------|--------------|
| **Day Trade** | Stock | Daily to 5min | 5min to 1min | EMA(13,5) | EMA(13,5) |
| **Day Trade** | Futures | Daily to 5min | 377 to 89 tick | EMA(13,5) | EMA(13,5) |
| **Swing Trade** | Stock | Daily to 1hr | 30min to 15min | EMA(13,5) | EMA(34,8) |
| **Swing Trade** | Futures | Daily to 1hr | 30min to 15min | EMA(13,5) | EMA(34,8) |

### Moving Average Configurations
- **EMA(13,5)**: 13-period slow, 5-period fast exponential moving averages
- **EMA(34,8)**: 34-period slow, 8-period fast exponential moving averages  
- **SMA(200,50)**: 200-period and 50-period simple moving averages for trend context

## Technical Implementation Concepts

### Data Processing Flow
1. **Market Data Ingestion** → Ticker bars stored in time-series database
2. **Inflection Point Detection** → Pattern analysis identifies turning points  
3. **Fractal Leg Construction** → Movements between inflection points become fractal legs
4. **Meta Fractal Formation** → Higher-order patterns detected from base legs
5. **Fibonacci Analysis** → Setup zones calculated from fractal structure
6. **Trigger Detection** → Entry signals identified on lower timeframes
7. **Trade Execution** → Automated order placement (future capability)

### Event-Driven Architecture
- **Real-time Processing** - New data triggers analysis pipeline
- **Message Queues** - Components communicate via events
- **Incremental Updates** - Analysis updates as new data arrives
- **Historical Replay** - Backtesting uses same event structure

## Quality Assurance Concepts

### Algorithm Validation
- **Deterministic Results** - Same input always produces same output
- **Historical Consistency** - Algorithm works identically on historical and real-time data
- **Performance Testing** - Verify detection accuracy and timing
- **Edge Case Handling** - Graceful handling of market anomalies

### Testing Strategies  
- **Unit Testing** - Individual component validation
- **Integration Testing** - End-to-end workflow verification
- **Scenario Testing** - Specific market condition simulations
- **Performance Testing** - Real-time processing capability validation

## Glossary Quick Reference

| Term | Definition |
|------|------------|
| **Fractal Leg** | Price movement between two consecutive inflection points |
| **Inflection Point** | Significant turning point in price action |
| **Setup** | Fibonacci price cluster indicating potential trading opportunity |
| **Trigger** | Entry signal confirming setup validity |
| **Meta Fractal** | Higher-order fractal leg composed of multiple base fractal legs |
| **Price Cluster** | Convergence of multiple Fibonacci levels in tight price range |
| **Retracement** | Pullback against the primary trend |
| **Extension** | Price target beyond the current swing extreme |
| **Symmetry** | Measured move projection based on prior swing |

---

## Usage Notes

### For AI Conversations
- **Always reference this vocabulary** when discussing trading concepts
- **Use precise terms** rather than generic descriptions  
- **Maintain consistency** across all requirement documents
- **Update definitions** as understanding evolves

### For Development
- **Code should reflect domain language** - variable names match concepts
- **Comments should use domain terms** for clarity
- **API interfaces should expose domain concepts** not technical abstractions

---

*This vocabulary forms the foundation for all trading algorithm platform discussions. Consistent use of these terms ensures clear communication between business requirements and technical implementation.*