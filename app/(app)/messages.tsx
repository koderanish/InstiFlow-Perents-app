import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View, type ListRenderItem, type NativeScrollEvent, type NativeSyntheticEvent, type TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGoBack } from '@/components/account/nav';
import { MessageBubble, DaySeparator } from '@/components/chat/bubble';
import { Composer } from '@/components/chat/composer';
import { useChatThread } from '@/components/chat/hooks';
import { ChatHeader, EmptyChat, StaleNote, ThreadSkeleton } from '@/components/chat/parts';
import { useNow } from '@/components/learn/hooks';
import { ErrorState } from '@/components/ui';
import { SCHOOL } from '@/config/school';
import { useT } from '@/i18n';
import { friendlyError } from '@/lib/errors';
import type { ChatRow } from '@/lib/messages';
import { useStyles, type Theme } from '@/theme';

/** Within this many px of the newest message counts as "reading the latest". */
const NEAR_BOTTOM_PX = 120;

export default function MessagesScreen() {
  const styles = useStyles(createStyles);
  const t = useT();
  const goBack = useGoBack();
  const now = useNow();
  const { query, rows, hasMessages, send, retry, discard, isFresh } = useChatThread();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<ChatRow>>(null);
  const nearBottom = useRef(true);

  const newest = rows[0];
  const newestKey = newest?.key;
  const newestIsMine = newest?.type === 'message' && newest.item.sender === 'parent';

  // Stay on the newest message: always after the parent sends, and when a reply lands while they are at the bottom.
  useEffect(() => {
    if (!newestKey) return;
    if (newestIsMine || nearBottom.current) listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [newestKey, newestIsMine]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    nearBottom.current = e.nativeEvent.contentOffset.y < NEAR_BOTTOM_PX;
  }, []);

  const onSend = useCallback(() => {
    if (send(text)) setText('');
  }, [send, text]);

  const onPickStarter = useCallback((starter: string) => {
    setText(starter);
    inputRef.current?.focus();
  }, []);

  const renderItem = useCallback<ListRenderItem<ChatRow>>(
    ({ item }) => (item.type === 'day' ? <DaySeparator iso={item.iso} now={now} /> : <MessageBubble item={item.item} fresh={isFresh(item.key)} onRetry={retry} onDiscard={discard} />),
    [now, isFresh, retry, discard],
  );

  const header = <ChatHeader title={t('chat.title')} subtitle={SCHOOL.name} onBack={goBack} />;

  if (query.isError && !query.data) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
        {header}
        <ErrorState message={friendlyError(query.error, t)} onRetry={() => void query.refetch()} />
      </SafeAreaView>
    );
  }

  const ready = query.data !== undefined;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      {header}
      <KeyboardAvoidingView behavior="padding" style={styles.body}>
        {!ready ? (
          <ThreadSkeleton />
        ) : (
          <>
            {query.isError ? <StaleNote /> : null}
            {hasMessages ? (
              <View style={styles.listWrap}>
                <FlatList
                  ref={listRef}
                  inverted
                  data={rows}
                  keyExtractor={(row) => row.key}
                  renderItem={renderItem}
                  onScroll={onScroll}
                  scrollEventThrottle={64}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.list}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            ) : (
              <EmptyChat onPick={onPickStarter} />
            )}
          </>
        )}
        {ready ? <Composer value={text} onChangeText={setText} onSend={onSend} inputRef={inputRef} /> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = ({ colors }: Theme) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.bg },
    body: { flex: 1 },
    listWrap: { flex: 1 },
    list: { paddingVertical: 12 },
  });
