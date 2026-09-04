const simulate = require('miniprogram-simulate')
const path = require('path')

const calendarId = simulate.load(path.resolve(__dirname, '../../components/calendar/calendar'))

describe('calendar 组件', () => {
  test('加载组件成功', () => {
    expect(calendarId).toBeTruthy()
  })

  test('默认渲染生成 42 格日历', () => {
    const instance = simulate.render(calendarId, {
      currentDate: '2024-06-15',
      recordsMap: {},
      anniversariesMap: {}
    })
    expect(instance.data.calendarDays.length).toBe(42)
    expect(instance.data.currentYear).toBe(2024)
    expect(instance.data.currentMonth).toBe('六月')
  })

  test('当前月日期数量正确', () => {
    const instance = simulate.render(calendarId, {
      currentDate: '2024-06-15',
      recordsMap: {},
      anniversariesMap: {}
    })
    const juneDays = instance.data.calendarDays.filter(d => d.isCurrentMonth)
    expect(juneDays.length).toBe(30)
  })

  test('recordsMap 标记有记录的日期', () => {
    const instance = simulate.render(calendarId, {
      currentDate: '2024-06-15',
      recordsMap: { '2024-06-15': [{ _id: '1' }] },
      anniversariesMap: {}
    })
    const day15 = instance.data.calendarDays.find(d => d.date === '2024-06-15')
    expect(day15.hasRecord).toBe(true)

    const day16 = instance.data.calendarDays.find(d => d.date === '2024-06-16')
    expect(day16.hasRecord).toBeFalsy()
  })

  test('anniversariesMap 标记纪念日', () => {
    const instance = simulate.render(calendarId, {
      currentDate: '2024-06-15',
      recordsMap: {},
      anniversariesMap: { '2024-06-20': [{ _id: 'a1' }] }
    })
    const day20 = instance.data.calendarDays.find(d => d.date === '2024-06-20')
    expect(day20.isAnniversary).toBe(true)
  })

  test('currentDate 变更后重新生成日历', () => {
    const instance = simulate.render(calendarId, {
      currentDate: '2024-01-15',
      recordsMap: {},
      anniversariesMap: {}
    })
    expect(instance.data.currentMonth).toBe('一月')

    instance.setData({ currentDate: '2024-03-15' })
    expect(instance.data.currentMonth).toBe('三月')
    const marchDays = instance.data.calendarDays.filter(d => d.isCurrentMonth)
    expect(marchDays.length).toBe(31)
  })

  test('跨年切换正确', () => {
    const instance = simulate.render(calendarId, {
      currentDate: '2024-01-15',
      recordsMap: {},
      anniversariesMap: {}
    })
    expect(instance.data.currentYear).toBe(2024)

    instance.setData({ currentDate: '2023-12-15' })
    expect(instance.data.currentYear).toBe(2023)
    expect(instance.data.currentMonth).toBe('十二月')
  })

  test('日历网格始终 42 格', () => {
    const months = ['2024-01-01', '2024-02-01', '2024-06-01', '2024-12-01']
    for (const date of months) {
      const instance = simulate.render(calendarId, {
        currentDate: date,
        recordsMap: {},
        anniversariesMap: {}
      })
      expect(instance.data.calendarDays.length).toBe(42)
    }
  })

  test('今日高亮标记', () => {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const todayStr = `${y}-${m}-${d}`

    const instance = simulate.render(calendarId, {
      currentDate: todayStr,
      recordsMap: {},
      anniversariesMap: {}
    })
    const todayDay = instance.data.calendarDays.find(item => item.date === todayStr)
    expect(todayDay.isToday).toBe(true)
  })

  test('recordsMap 变更后标记更新', () => {
    const instance = simulate.render(calendarId, {
      currentDate: '2024-06-15',
      recordsMap: {},
      anniversariesMap: {}
    })
    const day15Before = instance.data.calendarDays.find(d => d.date === '2024-06-15')
    expect(day15Before.hasRecord).toBeFalsy()

    instance.setData({
      recordsMap: { '2024-06-15': [{ _id: 'new' }] }
    })
    const day15After = instance.data.calendarDays.find(d => d.date === '2024-06-15')
    expect(day15After.hasRecord).toBe(true)
  })
})
