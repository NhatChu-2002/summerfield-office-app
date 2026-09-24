import test from 'node:test'
import assert from 'node:assert/strict'
import { filterLessons, learningSummary, scoreQuiz } from './model.ts'

const lessons = [
  { id: 'old', department: 'company', title: 'Shift handoffs', topic: 'Operations', why: 'Keep the next team ready', createdAt: '2026-09-01' },
  { id: 'new', department: 'marketing', title: 'Campaign results', topic: 'Analytics', why: 'Read the numbers', createdAt: '2026-09-20' },
]

test('learning filters by team and text, newest first without changing source order', () => {
  assert.deepEqual(filterLessons(lessons, '', '').map((lesson) => lesson.id), ['new', 'old'])
  assert.deepEqual(filterLessons(lessons, 'company', 'HANDOFF').map((lesson) => lesson.id), ['old'])
  assert.deepEqual(filterLessons(lessons, 'company', 'analytics'), [])
  assert.equal(lessons[0].id, 'old')
})

test('summary ignores progress for lessons no longer in the library', () => {
  assert.deepEqual(learningSummary(lessons, { done: { old: '2026-09-24', deleted: '2026-09-22' }, scores: { old: 80, new: 100, deleted: 0 } }), { done: 1, total: 2, average: 90 })
  assert.deepEqual(learningSummary([], { done: {}, scores: {} }), { done: 0, total: 0, average: null })
})

test('quiz scoring requires a valid answer to every question', () => {
  const questions = [{ options: ['a', 'b'], answer: 1 }, { options: ['c', 'd'], answer: 0 }]
  assert.equal(scoreQuiz(questions, { 0: 1 }), null)
  assert.equal(scoreQuiz(questions, { 0: 2, 1: 0 }), null)
  assert.equal(scoreQuiz([], {}), null)
  assert.deepEqual(scoreQuiz(questions, { 0: 1, 1: 1 }), { right: 1, total: 2, percent: 50 })
})
