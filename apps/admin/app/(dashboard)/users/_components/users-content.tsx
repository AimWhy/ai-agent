"use client"

import { UsersPage } from './users-page'
import { useAdminUsersPage } from '../hooks/use-admin-users-page'

export function UsersContent() {
  const {
    users,
    page,
    total,
    totalPages,
    canPrev,
    canNext,
    prevPage,
    nextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminUsersPage()

  return (
    <UsersPage
      users={users}
      page={page}
      total={total}
      totalPages={totalPages}
      canPrev={canPrev}
      canNext={canNext}
      onPrevPage={prevPage}
      onNextPage={nextPage}
      isLoading={isLoading}
      isError={isError}
      errorMessage={error instanceof Error ? error.message : 'Request failed'}
      onRetry={() => {
        void refetch()
      }}
    />
  )
}
