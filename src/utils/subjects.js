/** Subject is removed / soft-deleted — hide from all UI lists */
export const isSubjectDeleted = (subject) =>
  subject?.isActive === false ||
  subject?.deletedAt != null ||
  subject?.isDeleted === true;

export const filterActiveSubjects = (list) =>
  (Array.isArray(list) ? list : []).filter((s) => !isSubjectDeleted(s));

/** Normalize HOD subjects API payload and drop deleted rows */
export const parseActiveSubjectsFromResponse = (res) => {
  const raw = Array.isArray(res?.data)
    ? res.data
    : Array.isArray(res?.data?.subjects)
    ? res.data.subjects
    : Array.isArray(res?.subjects)
    ? res.subjects
    : Array.isArray(res)
    ? res
    : [];
  return filterActiveSubjects(raw);
};
